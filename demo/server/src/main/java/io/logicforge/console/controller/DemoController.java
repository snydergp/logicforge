package io.logicforge.console.controller;

import io.logicforge.console.mapping.DTOMapper;
import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.console.model.dto.config.ProcessConfigDTO;
import io.logicforge.console.model.dto.spec.EngineSpecDTO;
import io.logicforge.console.service.LogicForgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

@RestController
public class DemoController {

  // For demo purposes, we'll just use a single process configuration with a well-known ID
  private static final UUID PROCESS_ID =
      UUID.nameUUIDFromBytes("LOGICFORGE".getBytes(StandardCharsets.UTF_8));

  private final DTOMapper mapper;
  private final LogicForgeService service;

  @Autowired
  public DemoController(final DTOMapper mapper, final LogicForgeService service) {
    this.mapper = mapper;
    this.service = service;
  }

  @GetMapping(value = "/engine/spec", produces = MediaType.APPLICATION_JSON_VALUE)
  public EngineSpecDTO getEngineSpec() {
    return mapper.externalizeSpec();
  }

  @GetMapping(value = "/process", produces = MediaType.APPLICATION_JSON_VALUE)
  public ProcessConfigDTO getProcess() {
    final Optional<ExtendedProcessConfig> extendedProcessConfig =
        service.loadConfigById(PROCESS_ID);
    final ExtendedProcessConfig internal =
        extendedProcessConfig.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return mapper.external(internal);
  }

}
