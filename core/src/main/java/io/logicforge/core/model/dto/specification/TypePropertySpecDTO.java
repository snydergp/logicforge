package io.logicforge.core.model.dto.specification;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TypePropertySpecDTO {

  private String[] type;
  private boolean multi;
  private boolean optional;

}
