package io.logicforge.core.model.dto.specification;

import lombok.Data;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public class ExpressionSpecDTO {

  private String[] type;
  private boolean multi;

}
