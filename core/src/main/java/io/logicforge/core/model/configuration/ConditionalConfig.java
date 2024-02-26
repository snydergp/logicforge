package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Getter
public class ConditionalConfig extends ControlStatementConfig {

  private final ExpressionConfig condition;

  private final Type type = Type.CONDITIONAL;

  public ConditionalConfig(final Type type, final List<BlockConfig> blocks,
      ExpressionConfig condition) {
    super(type, blocks);
    this.condition = condition;
  }

  public BlockConfig getThen() {
    return getBlocks().get(0);
  }

  public BlockConfig getElse() {
    return getBlocks().get(1);
  }

}
