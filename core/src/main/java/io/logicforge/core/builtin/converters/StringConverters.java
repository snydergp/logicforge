package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.Converter;

/**
 * Text conversion methods
 */
public class StringConverters {

  @Converter
  public static int stringToInt(final String text) {
    return Integer.parseInt(text);
  }

  @Converter
  public static float stringToFloat(final String text) {
    return Float.parseFloat(text);
  }

  @Converter
  public static long stringToLong(final String text) {
    return Long.parseLong(text);
  }

  @Converter
  public static double stringToDouble(final String text) {
    return Double.parseDouble(text);
  }

  @Converter
  public static boolean toBoolean(final String text) {
    return Boolean.parseBoolean(text);
  }

}
