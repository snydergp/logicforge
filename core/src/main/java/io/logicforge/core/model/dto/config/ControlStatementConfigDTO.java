package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ControlStatementConfigDTO extends ExecutableConfigDTO {


  private ControlStatementType type;

  private List<BlockConfigDTO> blocks;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.CONTROL_STATEMENT;
  }
}
