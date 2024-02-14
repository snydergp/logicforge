package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.exception.MissingVariableException;
import io.logicforge.core.injectable.ExecutionContext;

public class VariableFunctions {

  @Function
  public static boolean isSet(final int index, final ExecutionContext context) {
    return context.isSet(index);
  }
}
