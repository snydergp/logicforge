package io.logicforge.core.engine.impl;

import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.common.Coordinates;
import io.logicforge.core.engine.Action;
import io.logicforge.core.engine.ExecutionContext;
import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.exception.ConversionException;
import io.logicforge.core.exception.MissingVariableException;
import io.logicforge.core.exception.ProcessExecutionException;
import io.logicforge.core.exception.UnexpectedVariableException;
import io.logicforge.core.model.specification.ConverterSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.TypePropertySpec;
import io.logicforge.core.model.specification.TypeSpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class DefaultExecutionContext implements ExecutionContext {

  private final EngineSpec engineSpec;

  private final CoordinateTrie<Optional<Object>> values = new CoordinateTrie<>();

  private final Map<Class<?>, Map<Class<?>, ConverterSpec>> converters = new HashMap<>();

  private final Set<CompletionObserver> observers = new LinkedHashSet<>();

  private final ExecutionQueue queue;

  private final CompletableFuture<Void> future = new CompletableFuture<>();

  private final AtomicInteger awaitingCompletion = new AtomicInteger();

  public DefaultExecutionContext(final EngineSpec engineSpec, ExecutionQueue queue,
                                 final Map<String, Object> args) {
    this.engineSpec = engineSpec;
    this.queue = queue;
    setVariable(Coordinates.ROOT, args);

    for (final ConverterSpec converter : engineSpec.getConverters()) {
      final Class<?> inputType = converter.getInputType();
      final Class<?> outputType = converter.getOutputType();
      final Map<Class<?>, ConverterSpec> outputMap = converters.computeIfAbsent(inputType, type -> new HashMap<>());
      outputMap.put(outputType, converter);
    }
  }

  @Override
  public boolean isVariableSet(final Coordinates coordinates, final Class<?> expectedType) {
    if (values.get(coordinates) != null && values.get(coordinates).isPresent()) {
      final Object value = values.get(coordinates).get();
      return canConvert(value, expectedType);
    }
    return false;
  }

  @Override
  public boolean isNestedVariableSet(final Coordinates coordinates, final Class<?> expectedType, final String ... path) {
    Object variable = values.get(coordinates).orElseThrow(MissingVariableException::new);
    if (variable == null) {
      return false;
    }
    final List<String> pathSegments = new ArrayList<>(Arrays.asList(path));
    if (coordinates.equals(Coordinates.ROOT)) {
      // the value stored at the root is always a map of the process arguments, indexed by name
      //  when a variable references the root value, the first path segment should be used to pull the actual
      //  value from that argument map
      final String name = pathSegments.remove(0);
      variable = ((Map<String, Object>) variable).get(name);
    }
    final Class<?> rootType = variable.getClass();
    TypeSpec typeSpec = engineSpec.getTypes().values().stream()
            .filter(spec -> spec.getRuntimeClass().equals(rootType)).findFirst()
            .orElseThrow(() -> new RuntimeException("Action %s return var contains unexpected type %s"
                    .formatted(coordinates, rootType)));
    for (final String property : pathSegments) {
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
    return variable != null && canConvert(variable, expectedType);
  }

  @Override
  public boolean isActionCompleted(final Coordinates coordinates) {
    return values.get(coordinates) != null;
  }

  @Override
  public <T> T getVariable(final Coordinates coordinates, final Class<T> expectedType) {
    if (!isVariableSet(coordinates, expectedType)) {
      throw new MissingVariableException();
    }
    final Object variable = values.get(coordinates).get();
    if (!canConvert(variable, expectedType)) {
      throw new UnexpectedVariableException();
    }
    return convert(variable, expectedType);
  }

  @Override
  public <T> T getNestedVariable(final Coordinates coordinates, final Class<T> expectedType, final String... path) {
    Object variable = values.get(coordinates).orElseThrow(MissingVariableException::new);
    final List<String> pathSegments = new ArrayList<>(Arrays.asList(path));
    if (coordinates.equals(Coordinates.ROOT)) {
      // the value stored at the root is always a map of the process arguments, indexed by name
      //  when a variable references the root value, the first path segment should be used to pull the actual
      //  value from that argument map
      final String name = pathSegments.removeFirst();
      variable = ((Map<String, Object>) variable).get(name);
    }
    final Class<?> rootType = variable.getClass();
    TypeSpec typeSpec = engineSpec.getTypes().values().stream()
            .filter(spec -> spec.getRuntimeClass().equals(rootType)).findFirst()
            .orElseThrow(() -> new RuntimeException("Action %s return var contains unexpected type %s"
                    .formatted(coordinates, rootType)));
    for (final String property : pathSegments) {
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
    if (!canConvert(variable, expectedType)) {
      throw new UnexpectedVariableException();
    }
    return convert(variable, expectedType);
  }

  @Override
  public void setVariable(final Coordinates coordinates, final Object value) {
    values.put(coordinates, Optional.ofNullable(value));
  }

  @Override
  public void enqueue(final List<Action> actions) {
    actions.forEach(this::initializeAction);
  }

  @Override
  public void enqueue(Action action) {
    initializeAction(action);
  }

  @Override
  public <T> T await(final Action returnAction, Class<T> type) {
    try {
      future.get();
    } catch (InterruptedException | ExecutionException e) {
      throw new ProcessExecutionException(e);
    }
    return convert(returnAction.execute(this), type);
  }

  @Override
  public <T> T convert(final Object value, final Class<T> type) {
    Objects.requireNonNull(value);
    final Class<?> inputClass = value.getClass();
    if (inputClass.equals(type)) {
      return (T) value;
    }
    if (!converters.containsKey(inputClass) || !converters.get(inputClass).containsKey(type)) {
      throw new ConversionException(value, type, "No converter registered");
    }
    final ConverterSpec converterSpec = converters.get(inputClass).get(type);
    try {
      return (T) converterSpec.getMethod().invoke(converterSpec.getProvider(), value);
    } catch (IllegalAccessException | InvocationTargetException e) {
      throw new ConversionException(value, type, "Unexpected error", e);
    }
  }

  @Override
  public boolean canConvert(final Object value, final Class<?> type) {
    Objects.requireNonNull(value);
    final Class<?> inputClass = value.getClass();
    return inputClass.equals(type) || (converters.containsKey(inputClass) && converters.get(inputClass).containsKey(type));
  }

  /**
   * Checks if an action is ready to execute and, if so, submits it for execution. If the action is still awaiting
   * dependencies, an observer will be created to listen for those to complete.
   * @param action the action
   */
  public synchronized void initializeAction(final Action action) {
    if (future.isDone()) {
      throw new IllegalStateException("The process has already completed");
    }
    awaitingCompletion.incrementAndGet();
    final List<Coordinates> dependencyCoordinates = action.getDependencyCoordinates();
    final Set<Coordinates> incompleteDependencies = dependencyCoordinates.stream()
            .filter(dep -> !isActionCompleted(dep))
            .collect(Collectors.toCollection(HashSet::new));
    if (incompleteDependencies.isEmpty()) {
      queue.submit(new ActionWrapper(action));
    } else {
      observers.add(new CompletionObserver(action, incompleteDependencies));
    }
  }

  public synchronized void completeAction(final Coordinates coordinates, final Object returnValue) {
    if (!coordinates.equals(Coordinates.ROOT)) {
      // root coordinates store the arguments and shouldn't be overwritten
      values.put(coordinates, Optional.ofNullable(returnValue));
    }
    observers.forEach(observer -> {
        try {
            observer.actionCompleted(coordinates);
        } catch (ExecutionException | InterruptedException e) {
            future.completeExceptionally(e);
        }
    });
    final int actionCount = awaitingCompletion.decrementAndGet();
    if (actionCount == 0) {
      future.complete(null);
    }
  }

  private class CompletionObserver {

    private final Action toExecute;
    private final Set<Coordinates> incompleteDependencies;

    private boolean submitted = false;

    private CompletionObserver(Action toExecute, Set<Coordinates> incompleteDependencies) {
      this.toExecute = toExecute;
      this.incompleteDependencies = incompleteDependencies;
    }

    public void actionCompleted(final Coordinates coordinates) throws ExecutionException, InterruptedException {
      incompleteDependencies.remove(coordinates);
      if (incompleteDependencies.isEmpty() && !submitted) {
        final Future<Object> submit = queue.submit(new ActionWrapper(toExecute));
              submit.get();
          observers.remove(this);
        submitted = true;
      }
    }

  }

  @RequiredArgsConstructor
  private class ActionWrapper implements Callable<Object> {

    private final Action action;

    @Override
    public String toString() {
      return action.getCoordinates().toString();
    }

    @Override
    public Object call() throws Exception {
      final Object returnValue = action.execute(DefaultExecutionContext.this);
      final Coordinates coordinates = action.getCoordinates();
      queue.submit(new AsyncNotifier(coordinates, returnValue));
      return returnValue;
    }
  }

  private class AsyncNotifier implements Callable<Object> {

    private final Coordinates coordinates;
    private final Object returnValue;

      private AsyncNotifier(Coordinates coordinates, Object returnValue) {
          this.coordinates = coordinates;
          this.returnValue = returnValue;
      }

      @Override
    public Object call() throws Exception {
      completeAction(coordinates, returnValue);
      return returnValue;
    }
  }

}
