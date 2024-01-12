package io.logicforge.core.builtin.actions;

import io.logicforge.core.annotations.Action;
import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.injectable.ModifiableExecutionContext;

public class ConditionalActions {

  @Action
  public void executeConditional(final boolean test, final ChildActions ifTrue,
      final ChildActions ifFalse, final ModifiableExecutionContext context) {
    (test ? ifTrue : ifFalse).execute(context);
  }

}
