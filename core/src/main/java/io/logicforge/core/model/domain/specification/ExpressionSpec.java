package io.logicforge.core.model.domain.specification;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@RequiredArgsConstructor
public abstract class ExpressionSpec {

  private final Class<?> type;
  private final boolean multi;

}
