package io.logicforge.core.model.specification;

/**
 * Represents a java method parameter (for an action or function method) that corresponds to a configured static value.
 */
public interface ComputedParameterSpec extends ParameterSpec {

  boolean isMulti();
}
