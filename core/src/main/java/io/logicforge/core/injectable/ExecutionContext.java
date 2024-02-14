package io.logicforge.core.injectable;

import io.logicforge.core.annotations.runtime.Injectable;
import io.logicforge.core.constant.EngineMethodType;

@Injectable(methodTypes = {EngineMethodType.FUNCTION, EngineMethodType.ACTION})
public interface ExecutionContext {

  boolean isSet(final int index);

  Object get(final int index);

}
