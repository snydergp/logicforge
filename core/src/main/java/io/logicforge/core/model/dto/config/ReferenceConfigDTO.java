package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ReferenceConfigDTO extends ExpressionConfigDTO {

  private int[] coordinates;
  private String[] path;

  @Override
  public ConfigType getDifferentiator() {
    return ConfigType.REFERENCE;
  }
}
