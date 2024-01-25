package io.logicforge.core.builtin.actions;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.injectable.ModifiableExecutionContext;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class VariableActions {

  @Action
  public static void setVariable(final String name, final Object value,
      final ModifiableExecutionContext context) {
    context.set(name, value);
  }

  @Action
  public static void deleteVariable(final String name, final ModifiableExecutionContext context) {
    context.delete(name);
  }


}
