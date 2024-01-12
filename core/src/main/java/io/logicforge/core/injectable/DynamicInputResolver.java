package io.logicforge.core.injectable;

import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.constant.EngineMethodType;

/**
 * An interface that can be used as a function parameter in cases where automated injection of inputs is not desired.
 * Automated inject always computes inputs prior to calling the function. This might not always be desired, e.g., in
 * cases where a function uses one or more inputs only conditionally might want to avoid computing that input unless it
 * turns out to be needed.
 */
@Injectable(methodTypes = { EngineMethodType.ACTION, EngineMethodType.FUNCTION })
public interface DynamicInputResolver {

  Object resolve(final String inputName);

}
