package io.logicforge.core.engine;

import io.logicforge.core.exception.EngineInitializationException;
import io.logicforge.core.exception.ProcessExecutionException;
import io.logicforge.core.injectable.ModifiableExecutionContext;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@Slf4j
public class ActionExecutor {

  public enum Status {
    NOT_STARTED, RUNNING, SHUTTING_DOWN, STOPPED
  }

  @Getter
  private Status status = Status.NOT_STARTED;

  private final ExecutorService executorService;
  private final LogicForgeOptions options;

  public ActionExecutor(final ExecutorService executorService, final LogicForgeOptions options) {
    this.executorService = executorService;
    this.options = options;
  }

  public Future<Void> executeAsync(final ModifiableExecutionContext context,
      final Action... actions) throws ProcessExecutionException {

    if (status != Status.RUNNING) {
      throw new IllegalStateException(
          String.format("Attempted to execute action while in %s state", status));
    }

    final CompletableFuture[] futures = Arrays.stream(actions)
        .map(action -> CompletableFuture.runAsync(() -> action.execute(context)))
        .toArray(CompletableFuture[]::new);
    return CompletableFuture.allOf(futures);
  }

  public void executeSync(final ModifiableExecutionContext context, final Action... actions)
      throws ProcessExecutionException {

    if (status != Status.RUNNING) {
      throw new IllegalStateException(
          String.format("Attempted to execute action while in %s state", status));
    }

    for (final Action action : actions) {
      final CompletableFuture<Void> future = doExecuteAsync(context, action);
      try {
        future.get();
      } catch (InterruptedException e) {
        throw new ProcessExecutionException("Action interrupted", e);
      } catch (ExecutionException e) {
        throw new ProcessExecutionException("Process terminated due to action failure", e);
      }
    }
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
    status = Status.RUNNING;
  }

  /**
   * Stops the engine. Construction and new executions of existing processes will fail immediately. Processes that have
   * already started will be given the provided wait duration to complete.
   */
  public void stop() {
    if (status != Status.RUNNING) {
      throw new IllegalStateException(
          String.format("Attempted to stop engine in %s state", status));
    }

    status = Status.SHUTTING_DOWN; // prevent additional process executions from starting
    new Timer().schedule(new TimerTask() {
      @Override
      public void run() {
        final List<Runnable> waiting = executorService.shutdownNow();
        log.info("Shutdown completed with {} actions awaiting execution", waiting.size());
        status = Status.STOPPED;
      }
    }, options.shutdownGracePeriod().toMillis());
  }

  private CompletableFuture<Void> doExecuteAsync(final ModifiableExecutionContext context,
      final Action action) throws ProcessExecutionException {
    final long timeout = options.actionTimeoutOverrides()
        .getOrDefault(action.getName(), options.defaultActionTimeout()).toMillis();
    final CompletableFuture<Void> future =
        CompletableFuture.runAsync(() -> action.execute(context), executorService);
    return timeout <= 0 ? future : future.orTimeout(timeout, TimeUnit.MILLISECONDS);
  }

}
