package io.logicforge.core.engine.impl;

import io.logicforge.core.engine.ExecutionQueue;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

/**
 * A simple ActionQueue implementation that submits actions directly to an executor as they are queued.
 */
public class SimpleExecutionQueue implements ExecutionQueue {

  private final ExecutorService executorService;

  public SimpleExecutionQueue(ExecutorService executorService) {
    this.executorService = executorService;
  }

  @Override
  public <T> Future<T> submit(final Callable<T> callable) {
    return executorService.submit(callable);
  }

  @Override
  public Future<?> submit(final Runnable runnable) {
    return executorService.submit(runnable);
  }
}
