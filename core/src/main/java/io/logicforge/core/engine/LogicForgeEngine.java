package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.specification.EngineSpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

/**
 *
 */
@Slf4j
@RequiredArgsConstructor
public class LogicForgeEngine {

  private final EngineSpec engineSpec;
  private final ProcessBuilder processBuilder;
  private final ExecutionQueue executionQueue;

  public <T extends Process> T buildProcess(final ProcessConfig<T> config)
      throws ProcessConstructionException {
    return processBuilder.buildProcess(config, executionQueue);
  }

}
