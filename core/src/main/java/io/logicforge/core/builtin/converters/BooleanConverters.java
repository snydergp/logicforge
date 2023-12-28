package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.Converter;

/**
 * Boolean conversion methods
 */
public class BooleanConverters {

  @Converter
  public static String toText(final Boolean bool) {
    return bool.toString();
  }

}
