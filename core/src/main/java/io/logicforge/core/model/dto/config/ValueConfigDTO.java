package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ExpressionType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@ToString
public class ValueConfigDTO extends ExpressionConfigDTO {

  private String value;
  private String typeId;

  @Override
  public ExpressionType getDifferentiator() {
    return ExpressionType.VALUE;
  }
}
