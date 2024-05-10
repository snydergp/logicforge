package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VariableConfigDTO implements ConfigDTO {

  private String title;
  private String description;

  @Override
  public ConfigType getDifferentiator() {
    return ConfigType.VARIABLE;
  }
}
