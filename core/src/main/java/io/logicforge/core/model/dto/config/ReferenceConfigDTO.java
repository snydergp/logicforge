package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ReferenceConfigDTO extends ExpressionConfigDTO {

  private int[] coordinates;
  private String[] path;

  @Override
  public ConfigType getDifferentiator() {
    return ConfigType.REFERENCE;
  }
}
