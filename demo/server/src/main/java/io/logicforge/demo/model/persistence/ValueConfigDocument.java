package io.logicforge.demo.model.persistence;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValueConfigDocument extends ExpressionConfigDocument {

  private String type;
  private String value;
}
