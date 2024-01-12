package io.logicforge.console.controller;

import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.specification.EngineSpec;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EngineController {

    @GetMapping(value = "/engine/{engineId}/spec", produces = MediaType.APPLICATION_JSON_VALUE)
    public EngineSpec getEngineSpec(@PathVariable final String engineId) {
        return null;
    }

    @GetMapping(value = "/process/{processId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ProcessConfig getProcess(@PathVariable final String processId) {
        return null;
    }

}
