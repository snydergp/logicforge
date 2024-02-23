package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessExecutionException;

import java.util.List;

public interface Action {

  Object execute(final ExecutionContext context) throws ProcessExecutionException;

  int[] getCoordinates();

  List<int[]> getDependencyCoordinates();


}
