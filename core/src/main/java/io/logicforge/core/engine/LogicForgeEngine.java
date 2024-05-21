package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.domain.specification.EngineSpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 *
 */
@Slf4j
@RequiredArgsConstructor
public class LogicForgeEngine {

  private final EngineSpec engineSpec;
  private final ProcessBuilder processBuilder;
  private final ExecutionQueue executionQueue;

  public <T extends Process> T buildProcess(final ProcessConfig<T, ?> config)
      throws ProcessConstructionException {
    return processBuilder.buildProcess(config, executionQueue);
  }

}
