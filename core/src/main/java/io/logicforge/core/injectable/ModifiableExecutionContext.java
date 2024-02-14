package io.logicforge.core.injectable;

import io.logicforge.core.annotations.runtime.Injectable;
import io.logicforge.core.constant.EngineMethodType;

@Injectable(methodTypes = EngineMethodType.ACTION)
public interface ModifiableExecutionContext extends ExecutionContext {

  void set(final int index, final Object value);

  ExecutionContext getReadonlyView();

}
