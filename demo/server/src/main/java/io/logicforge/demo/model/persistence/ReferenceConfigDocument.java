package io.logicforge.demo.model.persistence;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@ToString
public class ReferenceConfigDocument extends ExpressionConfigDocument {

  private int[] coordinates;
  private String[] path;
}
