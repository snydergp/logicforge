package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.Converter;

/**
 * Decimal conversion methods
 */
public class DecimalConverters {

  @Converter
  public static String toText(final Double decimal) {
    return decimal.toString();
  }

  @Converter
  public static Long toInteger(final Double decimal) {
    return decimal.longValue();
  }

}
