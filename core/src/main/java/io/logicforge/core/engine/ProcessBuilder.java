package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.configuration.ProcessConfig;

public interface ProcessBuilder {

  Process buildProcess(final ProcessConfig processConfig) throws ProcessConstructionException;

}
