package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessExecutionException;
import io.logicforge.core.injectable.ModifiableExecutionContext;

public interface Action {

  void execute(final ModifiableExecutionContext context) throws ProcessExecutionException;

  String getName();

  String getProcessId();

  String getPath();

  int getIndex();


}
