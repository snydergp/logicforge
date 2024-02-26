package io.logicforge.core.engine.impl;

import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.common.Coordinates;
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
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;

public class DefaultExecutionContext implements ExecutionContext {

  private final EngineSpec engineSpec;
  private final CoordinateTrie<Optional<Object>> values = new CoordinateTrie<>();
  private final Map<Class<?>, Map<Class<?>, ConverterSpec>> converters = new HashMap<>();
  private final ExecutionQueue queue;
  private final CompletableFuture<Void> future = new CompletableFuture<>();
  private final AtomicInteger executingAsyncCount = new AtomicInteger();

  private boolean mainThreadWaiting = false;

  public DefaultExecutionContext(final EngineSpec engineSpec, ExecutionQueue queue,
      final Map<String, Object> args) {
    this.engineSpec = engineSpec;
    this.queue = queue;
    setVariable(Coordinates.ROOT, args);

    for (final ConverterSpec converter : engineSpec.getConverters()) {
      final Class<?> inputType = converter.getInputType();
      final Class<?> outputType = converter.getOutputType();
      final Map<Class<?>, ConverterSpec> outputMap =
          converters.computeIfAbsent(inputType, type -> new HashMap<>());
      outputMap.put(outputType, converter);
    }
  }

  @Override
  public boolean isVariableSet(final Coordinates coordinates, final Class<?> expectedType,
      final String... path) {
    Object variable = values.get(coordinates).orElseThrow(MissingVariableException::new);
    if (variable instanceof Future<?>) {
      try {
        variable = ((Future<?>) variable).get();
      } catch (InterruptedException | ExecutionException e) {
        throw new ProcessExecutionException(e);
      }
    }
    if (variable == null) {
      return false;
    }
    final List<String> pathSegments = new ArrayList<>(Arrays.asList(path));
    if (coordinates.equals(Coordinates.ROOT) && !pathSegments.isEmpty()) {
      // the value stored at the root is always a map of the process arguments, indexed by name
      // when a variable references the root value, the first path segment should be used to pull the actual
      // value from that argument map
      final String name = pathSegments.remove(0);
      variable = ((Map<String, Object>) variable).get(name);
    }
    final Class<?> rootType = variable.getClass();
    TypeSpec typeSpec = engineSpec.getTypes().values().stream()
        .filter(spec -> spec.getRuntimeClass().equals(rootType)).findFirst()
        .orElseThrow(() -> new RuntimeException(
            "Action %s return var contains unexpected type %s".formatted(coordinates, rootType)));
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
    if (values.hasValue(coordinates) && values.get(coordinates).isPresent()) {
      final Object value = values.get(coordinates).get();
      if (value instanceof Future<?> aFuture) {
        return aFuture.isDone();
      }
      return true;
    }
    return false;
  }

  @Override
  public <T> T getVariable(final Coordinates coordinates, final Class<T> expectedType,
      final String... path) {
    Object variable = values.get(coordinates).orElseThrow(MissingVariableException::new);
    if (variable instanceof Future<?>) {
      try {
        variable = ((Future<?>) variable).get();
      } catch (InterruptedException | ExecutionException e) {
        throw new ProcessExecutionException(e);
      }
    }
    final List<String> pathSegments = new ArrayList<>(Arrays.asList(path));
    if (coordinates.equals(Coordinates.ROOT) && !pathSegments.isEmpty()) {
      // the value stored at the root is always a map of the process arguments, indexed by name
      // when a variable references the root value, the first path segment should be used to pull the actual
      // value from that argument map
      final String name = pathSegments.removeFirst();
      variable = ((Map<String, Object>) variable).get(name);
    }
    final Class<?> rootType = variable.getClass();
    TypeSpec typeSpec = engineSpec.getTypes().values().stream()
        .filter(spec -> spec.getRuntimeClass().equals(rootType)).findFirst()
        .orElseThrow(() -> new RuntimeException(
            "Action %s return var contains unexpected type %s".formatted(coordinates, rootType)));
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
    if (value instanceof Runnable runnable) {
      values.put(coordinates, Optional.of(queue.submit(new RunnableWrapper(runnable))));
      executingAsyncCount.incrementAndGet();
    } else if (value instanceof Callable<?> callable) {
      values.put(coordinates, Optional.of(queue.submit(new CallableWrapper(callable))));
      executingAsyncCount.incrementAndGet();
    } else {
      values.put(coordinates, Optional.ofNullable(value));
    }
  }

  @Override
  public void await() {
    try {
      if (executingAsyncCount.get() > 0) {
        mainThreadWaiting = true;
        future.get();
      }
    } catch (InterruptedException | ExecutionException e) {
      throw new ProcessExecutionException(e);
    }
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
    return inputClass.equals(type)
        || (converters.containsKey(inputClass) && converters.get(inputClass).containsKey(type));
  }

  @RequiredArgsConstructor
  private class CallableWrapper implements Callable<Object> {

    private final Callable<?> callable;

    @Override
    public Object call() throws Exception {
      try {
        return callable.call();
      } finally {
        final int count = executingAsyncCount.decrementAndGet();
        if (count == 0 && mainThreadWaiting) {
          future.complete(null);
        }
      }
    }
  }

  @RequiredArgsConstructor
  private class RunnableWrapper implements Runnable {

    private final Runnable runnable;

    @Override
    public void run() {
      try {
        runnable.run();
      } finally {
        final int count = executingAsyncCount.decrementAndGet();
        if (count == 0 && mainThreadWaiting) {
          future.complete(null);
        }
      }
    }
  }

}
