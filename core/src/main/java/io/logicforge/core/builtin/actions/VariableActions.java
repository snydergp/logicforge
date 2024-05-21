package io.logicforge.core.builtin.actions;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.metadata.InfluencesReturnType;

public final class VariableActions {

  @Action
  public static Object storeValue(@InfluencesReturnType
  final Object value) {
    return value;
  }

}
