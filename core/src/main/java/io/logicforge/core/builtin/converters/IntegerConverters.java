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
  public static double intToDouble(final int value) {
    return value;
  }

  @Converter
  public static long intToLong(final int value) {
    return value;
  }

  @Converter
  public static float intToFloat(final int value) {
    return (float) value;
  }

  @Converter
  public static String longToString(final long value) {
    return Long.toString(value);
  }

  @Converter
  public static double longToDouble(final long value) {
    return (double) value;
  }

  @Converter
  public static int longToInt(final long value) {
    return (int) value;
  }

  @Converter
  public static float longToFloat(final long value) {
    return (float) value;
  }

}
