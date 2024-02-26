package io.logicforge.core.engine;

import java.util.concurrent.Callable;
import java.util.concurrent.Future;

public interface ExecutionQueue {

  <T> Future<T> submit(final Callable<T> runnable);

  Future<?> submit(final Runnable runnable);

}
