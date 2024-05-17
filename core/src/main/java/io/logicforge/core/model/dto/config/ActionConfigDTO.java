package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ExecutableType;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@ToString
public class ActionConfigDTO extends ExecutableConfigDTO {

  private String name;
  private Map<String, List<ExpressionConfigDTO>> arguments;

  @Override
  public final ExecutableType getDifferentiator() {
    return ExecutableType.ACTION;
  }
}
