package io.logicforge.console.model.dto.config;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ActionConfigDTO {

    private String name;
    private Map<String, ArgumentConfigDTO> arguments;
}
