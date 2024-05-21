package io.logicforge.core.model.domain.specification;

import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

/**
 * Represents a declared parameter for a Java method exposed as either an Action or Function. Used
 * for mapping an input or injected argument to the method parameter used when calling the enclosing
 * function.
 */
@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class InputSpec extends ExpressionSpec {

  private final String name;

  private final Map<String, String> metadata;

}
