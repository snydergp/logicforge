package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ExpressionType;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@ToString
public class FunctionConfigDTO extends ExpressionConfigDTO {

  private String name;
  private Map<String, List<ExpressionConfigDTO>> arguments;

  @Override
  public final ExpressionType getDifferentiator() {
    return ExpressionType.FUNCTION;
  }
}
