package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.Input;
import io.logicforge.core.annotations.Function;
import io.logicforge.core.annotations.Property;
import io.logicforge.core.constant.BuiltinFunctionCategoryNames;

public class TextFunctions {

  @Function(categoryName = BuiltinFunctionCategoryNames.TEXT)
  public static String concatenate(final String join, final String... values) {
    return String.join(join, values);
  }

  @Function(categoryName = BuiltinFunctionCategoryNames.TEXT)
  public static String staticValue(
      @Input(properties = @Property(name = "editor", value = "textarea")) final String text) {
    return text;
  }

}
