package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.elements.Function;

public class TextFunctions {

  @Function
  public static String concatenate(final String join, final String... values) {
    return String.join(join, values);
  }

}
