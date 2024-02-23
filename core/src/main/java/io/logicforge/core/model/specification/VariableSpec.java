package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Data
@Builder
@RequiredArgsConstructor
public class VariableSpec {

  private final Class<?> type;

  private final boolean optional;

}
