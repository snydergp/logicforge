package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ExpressionType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@ToString
public class ReferenceConfigDTO extends ExpressionConfigDTO {

  private int[] coordinates;
  private String[] path;

  @Override
  public ExpressionType getDifferentiator() {
    return ExpressionType.REFERENCE;
  }
}
