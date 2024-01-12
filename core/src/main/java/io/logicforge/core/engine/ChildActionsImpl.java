package io.logicforge.core.engine;

import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.injectable.ModifiableExecutionContext;

public class ChildActionsImpl implements ChildActions {

  private final ActionExecutor executor;
  private final Action[] actions;

  public ChildActionsImpl(final ActionExecutor executor, final Action... actions) {
    this.executor = executor;
    this.actions = actions;
  }

  @Override
  public void executeSync(final ModifiableExecutionContext context) {
    executor.executeSync(context, actions);
  }

  @Override
  public void executeAsync(final ModifiableExecutionContext context) {
    executor.executeSync(context, actions);
  }
}
