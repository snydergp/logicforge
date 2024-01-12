package io.logicforge.core.model.specification;

import io.logicforge.core.injectable.ExecutionContext;

/**
 * Represents a java method parameter (for an action or function method) that corresponds to an injectable type (e.g.,
 * an {@link ExecutionContext} argument). Injected parameters are mapped to a producer based on their declared classes.
 */
public interface InjectedParameterSpec extends ParameterSpec {

}
