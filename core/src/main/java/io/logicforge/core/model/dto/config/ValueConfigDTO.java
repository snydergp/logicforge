package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ValueConfigDTO extends ExpressionConfigDTO {

  private String value;
  private String typeId;

  @Override
  public ConfigType getDifferentiator() {
    return ConfigType.VALUE;
  }
}
