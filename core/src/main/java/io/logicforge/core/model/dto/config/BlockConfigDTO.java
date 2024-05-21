package io.logicforge.core.model.dto.config;

import java.util.List;
import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class BlockConfigDTO {

  private List<ExecutableConfigDTO> executables;

}
