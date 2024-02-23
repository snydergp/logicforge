package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * Represents a declared parameter for a Java method exposed as either an Action or Function. Used for mapping an input
 * or injected argument to the method parameter used when calling the enclosing function.
 */
@Data
@Builder
@RequiredArgsConstructor
public class InputSpec {

  private final String name;

  private final Class<?> type;

  private final boolean multi;

}
