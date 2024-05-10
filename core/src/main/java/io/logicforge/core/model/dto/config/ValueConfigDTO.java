package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ValueConfigDTO extends ExpressionConfigDTO {

  private String value;
  private String typeId;

  @Override
  public ConfigType getDifferentiator() {
    return ConfigType.VALUE;
  }
}
