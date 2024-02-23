package io.logicforge.core.engine.impl;

import io.logicforge.core.engine.Action;
import io.logicforge.core.exception.MissingVariableException;
import io.logicforge.core.engine.ExecutionContext;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.TypePropertySpec;
import io.logicforge.core.model.specification.TypeSpec;

import java.lang.reflect.InvocationTargetException;
import java.util.*;

public class DefaultExecutionContext implements ExecutionContext {

  private enum ActionStatus {
    QUEUED, COMPLETED, SKIPPED
  }

  private final EngineSpec engineSpec;

  private final Map<int[], Optional<Object>> values = new HashMap<>();

  private final Map<int[], List<Observer>> pendingObservers = new HashMap<>();

  private final Object lock = new Object();

  public DefaultExecutionContext(final EngineSpec engineSpec) {
    this(engineSpec, new ArrayList<>());
  }

  public DefaultExecutionContext(final EngineSpec engineSpec,
      final List<Optional<Object>> initialState) {
    this.engineSpec = engineSpec;
    for (int i = 0; i < initialState.size(); i++) {
      final Optional<Object> variable = initialState.get(i);
      // initial variable coordinates index backwards starting from -1 (-1, -2, ...)
      int[] coordinates = new int[] {-1 * (i + 1)};
      values.put(coordinates, variable);
    }
  }

  @Override
  public boolean isVariableSet(final int[] coordinates) {
    return values.containsKey(coordinates) && values.get(coordinates).isPresent();
  }

  @Override
  public boolean isNestedVariableSet(final int[] coordinates, final String[] path) {
    Object variable = values.get(coordinates).orElseThrow(MissingVariableException::new);
    if (variable == null) {
      return false;
    }
    final Class<?> rootType = variable.getClass();
    TypeSpec typeSpec = engineSpec.getTypes().values().stream()
        .filter(spec -> spec.getRuntimeClass().equals(rootType)).findFirst()
        .orElseThrow(() -> new RuntimeException("Action %s return var contains unexpected type %s"
            .formatted(Arrays.toString(coordinates), rootType)));
    for (final String property : path) {
      if (variable == null) {
        return false;
      }
      final TypePropertySpec typePropertySpec = typeSpec.getProperties().get(property);
      if (typePropertySpec == null) {
        throw new RuntimeException("Attempted to resolve undefined property %s on rootType %s"
            .formatted(property, typeSpec.getRuntimeClass()));
      }

      try {
        variable = typePropertySpec.getGetter().invoke(variable);
        typeSpec = engineSpec.getTypes().get(typePropertySpec.getTypeId());
      } catch (IllegalAccessException | InvocationTargetException e) {
        throw new RuntimeException("Failure calling getter %s for nested property on rootType %s"
            .formatted(typePropertySpec.getGetter(), typeSpec.getRuntimeClass()), e);
      }
    }
    return variable != null;
  }

  @Override
  public boolean isActionCompleted(final int[] coordinates) {
    return values.containsKey(coordinates);
  }

  @Override
  public Object getVariable(final int[] coordinates) {
    if (!isVariableSet(coordinates)) {
      throw new MissingVariableException();
    }
    return values.get(coordinates);
  }

  @Override
  public Object getNestedVariable(final int[] coordinates, final String... path)
      throws MissingVariableException {
    Object variable = values.get(coordinates).orElseThrow(MissingVariableException::new);
    final Class<?> rootType = variable.getClass();
    TypeSpec typeSpec = engineSpec.getTypes().values().stream()
        .filter(spec -> spec.getRuntimeClass().equals(rootType)).findFirst()
        .orElseThrow(() -> new RuntimeException("Action %s return var contains unexpected type %s"
            .formatted(Arrays.toString(coordinates), rootType)));
    for (final String property : path) {
      final TypePropertySpec typePropertySpec = typeSpec.getProperties().get(property);
      if (typePropertySpec == null) {
        throw new RuntimeException("Attempted to resolve undefined property %s on rootType %s"
            .formatted(property, typeSpec.getRuntimeClass()));
      }

      try {
        variable = typePropertySpec.getGetter().invoke(variable);
        typeSpec = engineSpec.getTypes().get(typePropertySpec.getTypeId());
      } catch (IllegalAccessException | InvocationTargetException e) {
        throw new RuntimeException("Failure calling getter %s for nested property on rootType %s"
            .formatted(typePropertySpec.getGetter(), typeSpec.getRuntimeClass()), e);
      }
    }
    return variable;
  }

  @Override
  public void setVariable(final int[] coordinates, final Object value) {
    values.put(coordinates, Optional.ofNullable(value));
  }

  @Override
  public void enqueue(final List<Action> actions) {
    actions.forEach(ActionRunner::new);
  }

  @Override
  public void enqueue(Action action) {
    new ActionRunner(action);
  }

  private void addObserver(final int[] dependencyCoordinates, final Observer observer) {
    synchronized (lock) {
      final Optional<Object> optional = values.get(dependencyCoordinates);
      if (optional != null) {
        // when the optional exists, the action has completed, regardless of whether it returns a value
        observer.actionCompleted(dependencyCoordinates);
      } else {
        final List<Observer> observers =
            pendingObservers.computeIfAbsent(dependencyCoordinates, (c) -> new ArrayList<>());
        observers.add(observer);
      }
    }
  }

  private void completeAction(final int[] coordinates, final Object value) {
    synchronized (lock) {
      values.put(coordinates, Optional.ofNullable(value));
      final List<Observer> observers = pendingObservers.remove(coordinates);
      if (observers != null) {
        observers.forEach(observer -> observer.actionCompleted(coordinates));
      }
    }
  }

  private interface Observer {

    void actionCompleted(final int[] coordinates);

  }

  private class ActionRunner implements Observer, Runnable {

    private final Action action;
    private final Set<int[]> pendingDependencies = new HashSet<>();

    private ActionRunner(Action action) {
      this.action = action;
      pendingDependencies.addAll(action.getDependencyCoordinates());
    }

    @Override
    public void actionCompleted(final int[] coordinates) {
      pendingDependencies.remove(coordinates);
      if (pendingDependencies.isEmpty()) {
        // TODO submit this runnable
      }
    }

    @Override
    public void run() {
      final Object returnValue = action.execute(DefaultExecutionContext.this);
      completeAction(action.getCoordinates(), returnValue);
    }
  }


}
