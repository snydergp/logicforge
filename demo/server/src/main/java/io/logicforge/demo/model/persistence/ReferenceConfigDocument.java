package io.logicforge.demo.model.persistence;

import io.logicforge.core.common.Coordinates;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class ReferenceConfigDocument extends ExpressionConfigDocument {

  private Coordinates coordinates;
  private String[] path;
}
