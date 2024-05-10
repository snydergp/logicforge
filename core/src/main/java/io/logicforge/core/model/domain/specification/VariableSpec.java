package io.logicforge.core.model.domain.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Builder
@RequiredArgsConstructor
public class VariableSpec {

  private final Class<?> type;
  private final String title;
  private final String description;
  private final boolean optional;

}
