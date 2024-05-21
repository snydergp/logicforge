package io.logicforge.core.validation;

import io.logicforge.core.common.InputCoordinate;
import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

import java.util.List;

@Builder
@Getter
public class ValidationError {

  private final int[] actionCoordinates;
  @Singular
  private final List<InputCoordinate> inputCoordinates;
  private final ErrorType errorType;

}
