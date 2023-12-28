package io.logicforge.core.injectable;

import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.constant.EngineMethodType;

@Injectable(methodTypes = { EngineMethodType.FUNCTION, EngineMethodType.ACTION })
public interface ExecutionContext {

  boolean contains(final String name);

  <T> T get(final String name, final Class<T> type);

  <T> T get(final String name, final T defaultValue);

  Object get(final String name);

}
