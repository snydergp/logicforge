package io.logicforge.core.engine.impl;

import io.logicforge.core.injectable.ModifiableExecutionContext;
import io.logicforge.core.engine.Process;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The internal Process implementation, allowing execution of the represented process against a provided payload.
 */
@RequiredArgsConstructor
public class ProcessImpl implements Process {

  private final ProcessConfig configuration;
  private final Function<ActionConfig, Function<ModifiableExecutionContext, Future<Void>>> actionExecutorConstructor;

  private final Lock lock = new ReentrantLock();

  private List<Function<ModifiableExecutionContext, Future<Void>>> executorCache;

  @Override
  public Future<Void> execute(final ModifiableExecutionContext context) {
    if (executorCache == null) {
      compile();
    }
    return new FutureTask<>(() -> this.doExecute(context));
  }

  private void compile() {
    if (executorCache == null) {
      final List<ActionConfig> actionConfigs = configuration.getActions();
      // If multiple attempts to execute the uninitialized process happen simultaneously, only one should
      // initialize the cache
      lock.lock();
      executorCache =
          actionConfigs.stream().map(actionExecutorConstructor).collect(Collectors.toList());
      lock.unlock();
    }
  }

  private Void doExecute(final ModifiableExecutionContext context) {
    for (final Function<ModifiableExecutionContext, Future<Void>> actionExecutor : executorCache) {
      final Future<Void> futureAction = actionExecutor.apply(context);
      try {
        futureAction.get();
      } catch (InterruptedException | ExecutionException e) {
        throw new RuntimeException(e); // TODO
      }
    }
    return null;
  }
}
