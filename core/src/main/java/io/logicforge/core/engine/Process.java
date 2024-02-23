package io.logicforge.core.engine;

public interface Process {

  void execute(final Object... initialVariables);

  String getProcessId();

  long getExecutionCount();

}
