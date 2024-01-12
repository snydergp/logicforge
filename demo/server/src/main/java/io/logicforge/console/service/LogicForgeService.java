package io.logicforge.console.service;

import io.logicforge.console.dao.ProcessConfigDAO;
import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.model.specification.EngineSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogicForgeService {

  @Getter
  private final EngineSpec engineSpec;
  private final CompilationProcessBuilder compiler;
  private final ProcessConfigDAO processConfigDAO;

  @Autowired
  public LogicForgeService(final EngineSpec engineSpec, final ProcessConfigDAO processConfigDAO) {
    this.engineSpec = engineSpec;
    this.compiler = new CompilationProcessBuilder(engineSpec);
    this.processConfigDAO = processConfigDAO;
  }

  public Optional<ExtendedProcessConfig> loadConfigById(final UUID id) {
    return processConfigDAO.getById(id);
  }

}
