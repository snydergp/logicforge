package io.logicforge.core.model.specification;

/**
 * Represents a declared parameter for a Java method exposed as either an Action or Function. Used for mapping an input
 * or injected argument to the method parameter used when calling the enclosing function.
 */
public interface ParameterSpec {

  Class<?> getType();

  String getName();

}
