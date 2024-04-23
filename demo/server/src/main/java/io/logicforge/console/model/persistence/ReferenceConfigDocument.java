package io.logicforge.console.model.persistence;

import io.logicforge.core.common.Coordinates;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReferenceConfigDocument extends InputConfigDocument {
  private Coordinates coordinates;
  private
}
