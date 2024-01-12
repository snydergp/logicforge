package io.logicforge.console.model.dto.config;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InputListConfigDTO extends ArgumentConfigDTO {

    private List<InputConfigDTO> inputs;
}
