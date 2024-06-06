package io.logicforge.core.builtin.operations;

import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.annotations.metadata.Category;
import io.logicforge.core.constant.WellKnownCategories;

@Category(WellKnownCategories.LOGIC)
public class LogicOperations {

  @Function
  public static boolean and(final boolean... values) {
    for (final boolean value : values) {
      if (!value) {
        return false;
      }
    }
    return true;
  }

  @Function
  public static boolean or(final boolean... values) {
    for (final boolean value : values) {
      if (value) {
        return true;
      }
    }
    return false;
  }

  @Function
  public static boolean not(final boolean value) {
    return !value;
  }

}
