package io.logicforge.core.engine;

import java.util.concurrent.Callable;
import java.util.concurrent.Future;

public interface ExecutionQueue {

  Future<Object> submit(Callable<Object> runnable);

}
