package io.logicforge.core.engine;

import io.logicforge.core.common.Coordinates;
import io.logicforge.core.exception.ProcessExecutionException;

import java.util.List;

public interface Action {

  Object execute(final ExecutionContext context) throws ProcessExecutionException;

  Coordinates getCoordinates();

  List<Coordinates> getDependencyCoordinates();


}
