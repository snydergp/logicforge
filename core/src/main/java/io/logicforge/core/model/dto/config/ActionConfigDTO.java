package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ActionConfigDTO extends ExecutableConfigDTO {

  private String name;
  private Map<String, List<ExpressionConfigDTO>> arguments;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.ACTION;
  }
}
