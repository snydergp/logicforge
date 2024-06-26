package io.logicforge.core.builtin.operations;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.metadata.Category;
import io.logicforge.core.annotations.metadata.InfluencesReturnType;
import io.logicforge.core.constant.WellKnownCategories;

@Category(WellKnownCategories.VARIABLE)
public final class VariableOperations {

  @Action
  public static Object storeValue(@InfluencesReturnType
  final Object... value) {
    return value;
  }

}
