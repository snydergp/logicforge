package io.logicforge.demo.model.persistence;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Builder
@Data
@ToString
public class ConditionalConfigDocument extends ControlStatementConfigDocument {

  private ExpressionConfigDocument condition;
  private List<BlockConfigDocument> blocks;

}
