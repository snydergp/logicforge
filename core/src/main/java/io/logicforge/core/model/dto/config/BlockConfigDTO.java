package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class BlockConfigDTO extends ExecutableConfigDTO {

  private List<ExecutableConfigDTO> executables;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.BLOCK;
  }
}
