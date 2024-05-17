package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ControlStatementType;
import io.logicforge.core.constant.ExecutableType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@ToString
public abstract class ControlStatementConfigDTO extends ExecutableConfigDTO {


  private ControlStatementType controlType;

  private List<BlockConfigDTO> blocks;

  @Override
  public final ExecutableType getDifferentiator() {
    return ExecutableType.CONTROL_STATEMENT;
  }
}
