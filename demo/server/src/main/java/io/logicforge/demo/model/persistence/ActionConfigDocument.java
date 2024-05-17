package io.logicforge.demo.model.persistence;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@ToString
public class ActionConfigDocument extends ExecutableConfigDocument {

  private String name;
  private Map<String, List<ExpressionConfigDocument>> inputs;
  private VariableConfigDocument output;
}
