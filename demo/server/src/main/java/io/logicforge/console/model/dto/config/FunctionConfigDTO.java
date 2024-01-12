package io.logicforge.console.model.dto.config;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class FunctionConfigDTO extends InputConfigDTO {

    private String name;
    private Map<String, InputListConfigDTO> arguments;
}
