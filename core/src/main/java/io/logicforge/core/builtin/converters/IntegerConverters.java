package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.Converter;

/**
 * Integer conversion methods
 */
public class IntegerConverters {

  @Converter
  public static String toText(final Long integer) {
    return integer.toString();
  }

  @Converter
  public static Double toDecimal(final Long integer) {
    return integer.doubleValue();
  }

}
