package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ControlStatementType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ConditionalConfigDTO extends ControlStatementConfigDTO {

  private final ControlStatementType type = ControlStatementType.CONDITIONAL;

  private final ExpressionConfigDTO condition;
}
