package io.logicforge.console.model.dto.config;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProcessConfigDTO {

    private UUID id;
    private List<ActionConfigDTO> actions;
}
