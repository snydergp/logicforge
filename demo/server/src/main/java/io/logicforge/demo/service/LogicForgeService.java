package io.logicforge.demo.service;

import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.engine.Process;
import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.engine.compile.ProcessCompiler;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.domain.specification.EngineSpec;
import io.logicforge.demo.dao.ProcessConfigDAO;
import io.logicforge.demo.model.domain.HttpRequest;
import io.logicforge.demo.model.domain.HttpResponse;
import io.logicforge.demo.model.domain.WebServerProcess;
import java.util.Optional;
import java.util.UUID;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LogicForgeService {

  @Getter
  private final EngineSpec engineSpec;
  private final CompilationProcessBuilder builder;
  private final ProcessConfigDAO processConfigDAO;
  private final ExecutionQueue executionQueue;

  @Autowired
  public LogicForgeService(final EngineSpec engineSpec, final ProcessCompiler compiler,
      final ProcessConfigDAO processConfigDAO, ExecutionQueue executionQueue) {
    this.engineSpec = engineSpec;
    this.executionQueue = executionQueue;
    this.builder = new CompilationProcessBuilder(engineSpec, compiler);
    this.processConfigDAO = processConfigDAO;
  }

  public <T extends Process> Optional<ProcessConfig<T, UUID>> loadConfigById(final UUID id,
      Class<T> processClass) {
    return processConfigDAO.getById(id, processClass);
  }

  public void saveConfig(final ProcessConfig<?, UUID> config) {
    processConfigDAO.save(config);
  }

  public HttpResponse executeHttpProcess(final UUID processId, final HttpRequest request)
      throws ProcessConstructionException {
    final Optional<ProcessConfig<WebServerProcess, UUID>> optionalProcessConfig = loadConfigById(
        processId, WebServerProcess.class);
    if (optionalProcessConfig.isEmpty()) {
      throw new RuntimeException("Process %s not found".formatted(processId));
    }

    final ProcessConfig<WebServerProcess, UUID> processConfig = optionalProcessConfig.get();
    final WebServerProcess webServerProcess = builder.buildProcess(processConfig, executionQueue);

    return webServerProcess.respond(request);
  }

}
