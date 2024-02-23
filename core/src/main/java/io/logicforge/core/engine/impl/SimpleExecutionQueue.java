package io.logicforge.core.engine.impl;

import io.logicforge.core.engine.ExecutionQueue;

import java.util.concurrent.ExecutorService;

/**
 * A simple ActionQueue implementation that submits actions directly to an executor as they are queued.
 */
public class SimpleExecutionQueue implements ExecutionQueue {

  private final ExecutorService executorService;

  public SimpleExecutionQueue(ExecutorService executorService) {
    this.executorService = executorService;
  }

  @Override
  public void submit(final Runnable runnable) {
    executorService.submit(runnable);
  }
}
