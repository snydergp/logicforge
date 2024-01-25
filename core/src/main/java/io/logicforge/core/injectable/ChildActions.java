package io.logicforge.core.injectable;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.runtime.Injectable;
import io.logicforge.core.constant.EngineMethodType;

/**
 * A parameter that can be injected into {@link Action} functions, representing an executable series of child actions.
 * Child actions might be used for actions that conditionally execute sets of children based on some input.
 */
@Injectable(methodTypes = EngineMethodType.ACTION)
public interface ChildActions {

  /**
   * Executes the child actions synchronously in a single thread. Actions are executed in their defined order.
   */
  void executeSync(final ModifiableExecutionContext context);

  /**
   * Executes the child actions asynchronously in-parallel. The actual number of threads used will be dependent on the
   * engine's concurrency settings.
   */
  void executeAsync(final ModifiableExecutionContext context);

}
