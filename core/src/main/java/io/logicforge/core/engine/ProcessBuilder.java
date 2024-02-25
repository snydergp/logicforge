package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.configuration.ProcessConfig;

public interface ProcessBuilder {

  <T extends Process> T buildProcess(final ProcessConfig<T> processConfig, final ExecutionQueue queue) throws ProcessConstructionException;

}
