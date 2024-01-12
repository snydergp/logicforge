package io.logicforge.core.injectable;

import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.constant.EngineMethodType;

@Injectable(methodTypes = {EngineMethodType.FUNCTION, EngineMethodType.ACTION})
public interface ExecutionContext {

  boolean contains(final String name);

  Object get(final String name, final Object defaultValue);

  Object get(final String name);

}
