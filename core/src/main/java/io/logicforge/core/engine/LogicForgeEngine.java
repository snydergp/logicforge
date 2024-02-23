package io.logicforge.core.engine;

import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.specification.EngineSpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

/**
 * This class provides the means to execute a given process (represented by a {@link ProcessConfig}). The engine returns
 * thread-safe {@link Process} instances which can be executed any number of times against any number of inputs. Process
 * instances can be cached and reused until {@link #stop(Duration)} is called on the engine, at which point no further
 * executions can be started.
 */
@Slf4j
@RequiredArgsConstructor
public class LogicForgeEngine {

  private final EngineSpec engineSpec;
  private final ProcessBuilder processBuilder;
  private final ExecutionQueue executionQueue;

  public Process buildProcess(final ProcessConfig config) throws ProcessConstructionException {
    return processBuilder.buildProcess(config);
  }

}
