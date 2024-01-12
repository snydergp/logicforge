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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

@RestController
public class EngineController {

    private final DTOMapper mapper;
    private final LogicForgeService service;

    @Autowired
    public EngineController(final DTOMapper mapper, final LogicForgeService service) {
        this.mapper = mapper;
        this.service = service;
    }

    @GetMapping(value = "/engine/spec", produces = MediaType.APPLICATION_JSON_VALUE)
    public EngineSpecDTO getEngineSpec() {
        return mapper.externalizeSpec();
    }

    @GetMapping(value = "/process/{processId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ProcessConfigDTO getProcess(@PathVariable final UUID processId) {
        final Optional<ExtendedProcessConfig> extendedProcessConfig = service.loadConfigById(processId);
        final ExtendedProcessConfig internal = extendedProcessConfig
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return mapper.external(internal);
    }

}
