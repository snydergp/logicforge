package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class BlockConfigDTO extends ExecutableConfigDTO {

  private List<ExecutableConfigDTO> executables;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.BLOCK;
  }
}
