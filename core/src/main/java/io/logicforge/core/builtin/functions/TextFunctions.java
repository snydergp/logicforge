package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.Function;
import io.logicforge.core.annotations.Input;
import io.logicforge.core.annotations.Property;

public class TextFunctions {

  @Function
  public static String concatenate(final String join, final String... values) {
    return String.join(join, values);
  }

  @Function
  public static String staticValue(
      @Input(properties = @Property(name = "editor", value = "textarea")) final String text) {
    return text;
  }

}
