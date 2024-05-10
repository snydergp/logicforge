package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.elements.Converter;

/**
 * Decimal conversion methods
 */
public class DecimalConverters {

  @Converter
  public static String floatToString(final float value) {
    return Float.toString(value);
  }

  @Converter
  public static int floatToInteger(final float value) {
    return (int) value;
  }

}
