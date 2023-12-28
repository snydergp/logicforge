package io.logicforge.core.injectable;

import io.logicforge.core.annotations.Action;
import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.constant.EngineMethodType;

import java.util.List;
import java.util.function.Function;

/**
 * A parameter that can be injected into {@link Action} functions, representing an executable series of child
 * actions. Child actions might be used for actions that conditionally execute sets of children based on some input.
 */
@Injectable(methodTypes = EngineMethodType.ACTION)
public interface ChildActions {

  /**
   * Executes the child actions. Actions are executes synchronously and in their defined order by a single thread.
   */
  void execute(final ModifiableExecutionContext context);

  /**
   * @return the list of child actions in their defined order
   */
  List<Function<ModifiableExecutionContext, Void>> getActions();

}
