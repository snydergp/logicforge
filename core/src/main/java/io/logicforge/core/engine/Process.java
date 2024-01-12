package io.logicforge.core.engine;

import io.logicforge.core.injectable.ModifiableExecutionContext;

public interface Process {

  void execute(final ModifiableExecutionContext context, final ActionExecutor executor);

  String getProcessId();

  long getExecutionCount();

}
