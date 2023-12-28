package io.logicforge.core.engine;

import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.engine.impl.ProcessImpl;
import io.logicforge.core.exception.EngineInitializationException;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.exception.ProcessExecutionException;
import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.injectable.DynamicInputResolver;
import io.logicforge.core.injectable.ExecutionContext;
import io.logicforge.core.injectable.ModifiableExecutionContext;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.ComputedParameterSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.InjectedParameterSpec;
import io.logicforge.core.model.specification.MethodSpec;
import io.logicforge.core.model.specification.ParameterSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.lang.invoke.MethodHandle;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * This class provides the means to execute a given process (represented by a {@link ProcessConfig}). The engine returns
 * thread-safe {@link Process} instances which can be executed any number of times against any number of inputs. Process
 * instances can be cached and reused until {@link #stop(Duration)} is called on the engine, at which point no further
 * executions can be started.
 */
@Slf4j
public class LogicForgeEngine {

  public enum Status {
    NOT_STARTED, RUNNING, SHUTTING_DOWN, STOPPED
  }

  private final EngineSpec specification;

  private final ExecutorService executorService;

  private final Map<Class<?>, InjectableFactory> factoryCache = new HashMap<>();

  @Getter
  private Status status = Status.NOT_STARTED;

  public LogicForgeEngine(final EngineSpec specification, final ExecutorService executorService) {
    this.specification = specification;
    this.executorService = executorService;
  }

  /**
   * Initializes the engine, preparing it to build and execute processes.
   *
   * @throws EngineInitializationException if an exception was encountered during initialization
   */
  public void start() throws EngineInitializationException {
    if (status != Status.NOT_STARTED) {
      throw new IllegalStateException(
          String.format("Attempted to start engine in %s state", status));
    }
  }

  /**
   * Stops the engine. Construction and new executions of existing processes will fail immediately. Processes that have
   * already started will be given the provided wait duration to complete.
   *
   * @param waitDuration the amount of time to wait for executing processes to complete
   */
  public void stop(final Duration waitDuration) {
    if (status != Status.RUNNING) {
      throw new IllegalStateException(
          String.format("Attempted to stop engine in %s state", status));
    }

    status = Status.SHUTTING_DOWN; // prevent additional process executions from starting
    new Timer().schedule(new TimerTask() {
      @Override
      public void run() {
        final List<Runnable> waiting = executorService.shutdownNow();
        log.info("Shutdown completed with {} threads awaiting execution", waiting.size());
        status = Status.STOPPED;
      }
    }, waitDuration == null ? 0L : waitDuration.toMillis());
  }

  public Process buildProcess(final ProcessConfig configuration) throws ProcessConstructionException {
    return new ProcessImpl(configuration, this::constructExecutor);
  }

  private Function<ExecutionContext, Object> constructResolver(final InputConfig configuration) {
    if (configuration instanceof ValueConfig) {
      return constructValueResolver((ValueConfig) configuration);
    } else if (configuration instanceof FunctionConfig) {
      return constructFunctionResolver((FunctionConfig) configuration);
    }
    throw new RuntimeException(); // TODO
  }

  private Function<ExecutionContext, Object> constructValueResolver(
      final ValueConfig configuration) {
    final Object value = configuration.getValue();
    return (executionContext) -> new FutureTask<>(() -> value);
  }

  private Function<ExecutionContext, Object> constructFunctionResolver(
      final FunctionConfig configuration) {

    final String functionName = configuration.getFunctionName();
    final MethodSpec methodInfo = specification.getFunctions().get(functionName);
    if (methodInfo == null) {
      throw new ProcessExecutionException(
          String.format("Function %s is not registered", functionName));
    }
    final Map<String, InputConfig> configuredInputs = configuration.getInputs();
    return new JavaMethodExecutor(methodInfo, configuredInputs);
  }

  private Function<ModifiableExecutionContext, Future<Void>> constructExecutor(
      final ActionConfig configuration) {

    final String actionName = configuration.getName();
    final ActionSpec methodInfo = specification.getActions().get(actionName);
    if (methodInfo == null) {
      throw new ProcessExecutionException(String.format("Action %s is not registered", actionName));
    }
    final Map<String, InputConfig> configuredInputs = configuration.getInputs();
    final JavaMethodExecutor executor = new JavaMethodExecutor(methodInfo, configuredInputs);
    // Actions are executed asynchronously on separate threads to allow us to limit the level of concurrency allowed
    return executionContext -> executorService.submit((Callable<Void>) () -> {
      executor.apply(executionContext);
      return null;
    });
  }

  /**
   * Encapsulates a java method (representing an action or function) and the input mapping needed to generate arguments
   * for executing it.
   */
  @RequiredArgsConstructor
  private class JavaMethodExecutor implements Function<ExecutionContext, Object> {

    private final MethodSpec methodInfo;
    private final Map<String, InputConfig> configuredInputs;

    /*
     * An ordered list of resolvers matching the parameters of the method to be called. When executing the method, these
     * will be used to produce the array of arguments passed in. These may be expensive to generate, so we defer until the
     * first execution, but they are safe to cache for subsequent executions.
     */
    private List<Function<ExecutionContext, Object>> argResolvers;

    private final Lock lock = new ReentrantLock();

    @Override
    public Object apply(final ExecutionContext executionContext) {
      if (argResolvers == null) {
        // only one thread should generate the cached resolvers
        lock.lock();
        argResolvers = generateArgumentResolvers(methodInfo.getParameters(), configuredInputs);
        lock.unlock();
      }
      final Object[] args = argResolvers.stream()
              .map(resolver -> resolver.apply(executionContext))
              .filter(Objects::nonNull)
              .flatMap(obj -> {
                // For multi parameters, we allow both functions that return a single value and functions returning
                //  an array. This block flattens these args into a single output list
                if (obj.getClass().isArray()) {
                  return Arrays.stream((Object[]) obj);
                } else {
                  return Stream.of(obj);
                }
              }).toArray();
      final MethodHandle method = methodInfo.getMethodHandle();
      final Object methodProvider = methodInfo.getProvider();
      try {
        final boolean invokeStatic = methodProvider instanceof Class<?>;
        if (invokeStatic) {
          return method.invoke(args);
        } else {
          return method.invokeWithArguments(methodProvider, args);
        }
      } catch (Throwable e) {
        throw new ProcessExecutionException("Execution failed", e);
      }
    }

    private List<Function<ExecutionContext, Object>> generateArgumentResolvers(
        final List<ParameterSpec> parameters, final Map<String, InputConfig> configuredInputs) {

      final List<Function<ExecutionContext, Object>> argResolvers = new ArrayList<>();
      for (final ParameterSpec parameter : parameters) {
        final Function<ExecutionContext, Object> resolver;
        if (parameter instanceof ComputedParameterSpec) {
          final String inputName = ((ComputedParameterSpec) parameter).getName();
          final InputConfig inputConfig = configuredInputs.get(inputName);
          if (inputConfig == null) {
            throw new RuntimeException(); // TODO
          }
          resolver = constructResolver(inputConfig);
        } else if (parameter instanceof InjectedParameterSpec) {
          final Class<?> type = parameter.getType();
          if (type.equals(ExecutionContext.class)) {
            resolver = (executionContext) -> new FutureTask<>(() -> executionContext);
          } else if (type.equals(DynamicInputResolver.class)) {
            resolver = (executionContext) -> (DynamicInputResolver) inputName -> {
              final InputConfig inputConfig = configuredInputs.get(inputName);
              return inputConfig == null ? null : constructResolver(inputConfig).apply(executionContext);
            };
          } else {
            final InjectableFactory factory = factoryCache.computeIfAbsent(type, t -> {
              try {
                final Injectable annotation = type.getAnnotation(Injectable.class);
                final Class<? extends InjectableFactory> factoryClass = annotation.factory();
                final Constructor<? extends InjectableFactory> constructor = factoryClass.getConstructor();
                return constructor.newInstance();
              } catch (InvocationTargetException | NoSuchMethodException | InstantiationException |
                       IllegalAccessException e) {
                  throw new RuntimeException("Unable to construct injectable factor instance for class " + type, e);
              }
            });
            resolver = (executionContext) -> factory.getInjectable(type, executionContext);
          }
        } else {
          throw new RuntimeException(); // TODO
        }
        argResolvers.add(resolver);
      }
      return argResolvers;
    }
  }

  private <T> Optional<Function<ExecutionContext, T>> generateBuiltinInjectableResolver(
          final Class<T> injectableType, final Map<String, InputConfig> configuredInputs) {

    Function<ExecutionContext, T> resolver = null;
    if (injectableType.equals(ExecutionContext.class)) {
      resolver = executionContext -> (T) executionContext;
    } else if (injectableType.equals(ModifiableExecutionContext.class)) {
      resolver = executionContext -> {
        if (executionContext instanceof ModifiableExecutionContext) {
          return (T) executionContext;
        } else {
          throw new RuntimeException("Attempted to access ModifiableExecutionContext outside action");
        }
      };
    } else if (injectableType.equals(ChildActions.class)) {

    } else if (injectableType.equals(DynamicInputResolver.class)) {
      resolver = (executionContext) -> (T) (DynamicInputResolver) inputName -> {
        final InputConfig inputConfig = configuredInputs.get(inputName);
        return inputConfig == null ? null : constructResolver(inputConfig).apply(executionContext);
      };
    }

    return Optional.ofNullable(resolver);
  }

}
