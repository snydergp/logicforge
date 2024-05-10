package io.logicforge.demo.service;

import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.engine.compile.ProcessCompiler;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.domain.specification.EngineSpec;
import io.logicforge.demo.dao.ProcessConfigDAO;
import io.logicforge.demo.model.domain.WebServerProcess;
import java.util.Optional;
import java.util.UUID;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogicForgeService {

  @Getter
  private final EngineSpec engineSpec;
  private final CompilationProcessBuilder builder;
  private final ProcessConfigDAO processConfigDAO;

  @Autowired
  public LogicForgeService(final EngineSpec engineSpec, final ProcessCompiler compiler,
      final ProcessConfigDAO processConfigDAO) {
    this.engineSpec = engineSpec;
    this.builder = new CompilationProcessBuilder(engineSpec, compiler);
    this.processConfigDAO = processConfigDAO;
  }

  public Optional<ProcessConfig<WebServerProcess, UUID>> loadConfigById(final UUID id) {
    return processConfigDAO.getById(id);
  }

}
