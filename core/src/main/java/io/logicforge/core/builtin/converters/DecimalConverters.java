package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.elements.Converter;

/**
 * Decimal conversion methods
 */
public class DecimalConverters {

  @Converter
  public static String doubleToString(final double value) {
    return Double.toString(value);
  }

  @Converter
  public static long doubleToLong(final double value) {
    return (long) value;
  }

  @Converter
  public static int doubleToInteger(final double value) {
    return (int) value;
  }

  @Converter
  public static float doubleToFloat(final double value) {
    return (float) value;
  }

  @Converter
  public static String floatToString(final float value) {
    return Float.toString(value);
  }

  @Converter
  public static long floatToLong(final float value) {
    return (long) value;
  }

  @Converter
  public static int floatToInteger(final float value) {
    return (int) value;
  }

  @Converter
  public static double floatToDouble(final float value) {
    return (double) value;
  }

}
