package io.logicforge.core.model.domain.config;

import io.logicforge.core.constant.ControlStatementType;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Getter
@SuperBuilder
public class ConditionalConfig extends ControlStatementConfig {

  private final ExpressionConfig condition;

  private final ControlStatementType type = ControlStatementType.CONDITIONAL;

  public BlockConfig getThen() {
    return getBlocks().get(0);
  }

  public BlockConfig getElse() {
    return getBlocks().get(1);
  }

}
