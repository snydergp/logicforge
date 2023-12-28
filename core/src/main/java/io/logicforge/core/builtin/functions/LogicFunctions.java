package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.Input;
import io.logicforge.core.annotations.Function;
import io.logicforge.core.constant.BuiltinFunctionCategoryNames;
import io.logicforge.core.annotations.Property;

import java.util.Arrays;

public class LogicFunctions {

  @Function(categoryName = BuiltinFunctionCategoryNames.LOGIC)
  public static Boolean and(final Boolean... values) {
    return Arrays.stream(values).allMatch(value -> value);
  }

  @Function(categoryName = BuiltinFunctionCategoryNames.LOGIC)
  public static Boolean or(final Boolean... values) {
    return Arrays.stream(values).anyMatch(value -> value);
  }

  @Function(categoryName = BuiltinFunctionCategoryNames.LOGIC)
  public static Boolean not(final Boolean value) {
    return !value;
  }

  @Function(categoryName = BuiltinFunctionCategoryNames.LOGIC)
  public static Boolean staticBoolean(
      @Input(properties = @Property(name = "editor", value = "boolean")) final Boolean value) {
    return value;
  }

}
