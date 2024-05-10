package io.logicforge.demo.model.persistence;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FunctionConfigDocument extends ExpressionConfigDocument {

  private String name;
  private Map<String, List<ExpressionConfigDocument>> arguments;
}
