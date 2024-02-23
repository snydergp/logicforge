package io.logicforge.core.engine;

public interface ExecutionQueue {

  void submit(Runnable runnable);

}
