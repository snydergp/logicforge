package io.logicforge.console.model.dto.config;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValueConfigDTO extends InputConfigDTO {

    private String value;
    private String type;
}
