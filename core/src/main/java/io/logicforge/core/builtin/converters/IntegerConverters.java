package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.elements.Converter;

/**
 * Integer conversion methods
 */
public class IntegerConverters {

  @Converter
  public static String intToString(final int value) {
    return Integer.toString(value);
  }

  @Converter
  public static float intToFloat(final int value) {
    return (float) value;
  }

}
