package io.logicforge.demo.controller;

import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.dto.config.ProcessConfigDTO;
import io.logicforge.core.model.dto.specification.EngineSpecDTO;
import io.logicforge.demo.mapping.CustomDTOMapper;
import io.logicforge.demo.model.domain.WebServerProcess;
import io.logicforge.demo.service.LogicForgeService;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DemoController {

  // For demo purposes, we'll just use a single process configuration with a well-known ID
  private static final UUID PROCESS_ID = UUID.nameUUIDFromBytes("LOGICFORGE".getBytes(
      StandardCharsets.UTF_8));

  private final CustomDTOMapper mapper;
  private final LogicForgeService service;

  @Autowired
  public DemoController(final CustomDTOMapper mapper, final LogicForgeService service) {
    this.mapper = mapper;
    this.service = service;
  }

  @GetMapping(value = "/engine/spec", produces = MediaType.APPLICATION_JSON_VALUE)
  public EngineSpecDTO getEngineSpec() {
    return mapper.externalSpec();
  }

  @GetMapping(value = "/process", produces = MediaType.APPLICATION_JSON_VALUE)
  public ProcessConfigDTO getProcess() {
    final Optional<ProcessConfig<WebServerProcess, UUID>> extendedProcessConfig = service
        .loadConfigById(PROCESS_ID);
    final ProcessConfig<WebServerProcess, UUID> internal = extendedProcessConfig.orElseThrow(
        () -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return mapper.external(internal);
  }

}
