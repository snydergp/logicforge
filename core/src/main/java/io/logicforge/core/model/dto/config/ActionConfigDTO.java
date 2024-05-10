package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ActionConfigDTO extends ExecutableConfigDTO {

  private String name;
  private Map<String, List<ExpressionConfigDTO>> arguments;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.ACTION;
  }
}
