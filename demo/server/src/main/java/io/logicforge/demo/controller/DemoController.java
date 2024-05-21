package io.logicforge.demo.controller;

import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.dto.config.ProcessConfigDTO;
import io.logicforge.core.model.dto.specification.EngineSpecDTO;
import io.logicforge.demo.mapping.CustomDTOMapper;
import io.logicforge.demo.model.domain.HttpMethod;
import io.logicforge.demo.model.domain.HttpRequest;
import io.logicforge.demo.model.domain.HttpResponse;
import io.logicforge.demo.model.domain.WebServerProcess;
import io.logicforge.demo.service.LogicForgeService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DemoController {

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

  @GetMapping(value = "/process/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
  public ProcessConfigDTO getProcess(@PathVariable
  final UUID id) {
    final Optional<ProcessConfig<WebServerProcess, UUID>> extendedProcessConfig = service
        .loadConfigById(id, WebServerProcess.class);
    final ProcessConfig<WebServerProcess, UUID> internal = extendedProcessConfig.orElseThrow(
        () -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return mapper.external(internal);
  }

  @PutMapping(value = "/process", produces = MediaType.APPLICATION_JSON_VALUE)
  public void saveProcess(@RequestBody
  final ProcessConfigDTO config) {
    final ProcessConfig<WebServerProcess, UUID> model = mapper.internal(config,
        WebServerProcess.class);
    service.saveConfig(model);
  }

  @RequestMapping(value = "/process/{id}/execute-http", produces = MediaType.APPLICATION_JSON_VALUE,
      method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE,
          RequestMethod.HEAD, RequestMethod.OPTIONS, RequestMethod.PATCH, RequestMethod.TRACE})
  public ResponseEntity<String> executeHttpProcess(@PathVariable
  final UUID id, final HttpServletRequest request) {

    final HttpMethod internalMethod = HttpMethod.valueOf(request.getMethod());
    final HttpRequest internalRequest = HttpRequest.builder()
        .method(internalMethod)
        .uri(request.getRequestURI())
        .build();

    try {
      final HttpResponse internalResponse = service.executeHttpProcess(id, internalRequest);
      return ResponseEntity.status(internalResponse.getStatus()).body(internalResponse.getBody());
    } catch (ProcessConstructionException e) {
      return ResponseEntity.internalServerError().body(e.getMessage());
    }
  }
}
