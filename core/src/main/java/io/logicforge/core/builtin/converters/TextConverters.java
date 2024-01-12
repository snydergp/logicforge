package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.Converter;

/**
 * Text conversion methods
 */
public class TextConverters {

  @Converter
  public static Long toLong(final String text) {
    return Long.parseLong(text);
  }

  @Converter
  public static Double toDecimal(final String text) {
    return Double.parseDouble(text);
  }

  @Converter
  public static Boolean toBoolean(final String text) {
    return Boolean.parseBoolean(text);
  }

}
