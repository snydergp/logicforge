package io.logicforge.core.builtin.actions;

import io.logicforge.core.annotations.Action;
import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.injectable.ModifiableExecutionContext;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;

public class ConcurrentActions {

  /**
   * An action that executes all nested actions concurrently
   *
   * @param actions
   * @param actionExecutor
   * @param context
   */
  @Action
  public void executeConcurrent(final ChildActions actions, final ExecutorService actionExecutor,
      final ModifiableExecutionContext context) {

    actions.getActions().stream().map(action -> actionExecutor.submit(() -> {
      action.apply(context);
    })).forEach(future -> {
      try {
        future.get();
      } catch (InterruptedException | ExecutionException e) {
        throw new RuntimeException(e);
      }
    });
  }

}
