package io.logicforge.demo.model.persistence;

import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Builder
@Data
public class ConditionalConfigDocument extends ControlStatementConfigDocument {

  private final ControlStatementType type = ControlStatementType.CONDITIONAL;
  private final ExpressionConfigDocument condition;
  private final List<BlockConfigDocument> blocks;

}
