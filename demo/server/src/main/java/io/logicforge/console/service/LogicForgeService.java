package io.logicforge.console.service;

import io.logicforge.console.dao.ProcessConfigDAO;
import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.engine.compile.ProcessCompiler;
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
  private final CompilationProcessBuilder builder;
  private final ProcessConfigDAO processConfigDAO;

  @Autowired
  public LogicForgeService(final EngineSpec engineSpec, final ProcessCompiler compiler, final ProcessConfigDAO processConfigDAO) {
    this.engineSpec = engineSpec;
    this.builder = new CompilationProcessBuilder(engineSpec, compiler);
    this.processConfigDAO = processConfigDAO;
  }

  public Optional<ExtendedProcessConfig> loadConfigById(final UUID id) {
    return Optional.empty(); // TODO connect once DB setup is complete
  }

}
