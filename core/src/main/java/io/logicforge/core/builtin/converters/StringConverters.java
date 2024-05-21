package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.elements.Converter;

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
  public static boolean toBoolean(final String text) {
    return Boolean.parseBoolean(text);
  }

}
