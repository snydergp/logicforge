package io.logicforge.core.builtin.converters;

import io.logicforge.core.annotations.elements.Converter;

/**
 * Boolean conversion methods
 */
public class BooleanConverters {

  @Converter
  public static String toText(final boolean bool) {
    return Boolean.toString(bool);
  }

}
