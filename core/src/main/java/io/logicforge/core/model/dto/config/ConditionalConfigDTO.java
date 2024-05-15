package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ControlStatementType;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ConditionalConfigDTO extends ControlStatementConfigDTO {

  private final ControlStatementType type = ControlStatementType.CONDITIONAL;

  private ExpressionConfigDTO condition;
}
