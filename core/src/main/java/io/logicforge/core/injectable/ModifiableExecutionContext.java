package io.logicforge.core.injectable;

import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.constant.EngineMethodType;

@Injectable(methodTypes = EngineMethodType.ACTION)
public interface ModifiableExecutionContext extends ExecutionContext {

  void set(final String name, final Object value);

  void delete(final String name);

}
