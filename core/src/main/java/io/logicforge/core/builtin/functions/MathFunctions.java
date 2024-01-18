package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.Function;

import java.util.Arrays;

public class MathFunctions {

  private static final String ERR_EMPTY = "this function requires at least one input value";

  @Function
  public static int minimumInt(final int... values) {
    return Arrays.stream(values).min().orElseThrow(() -> new IllegalStateException(ERR_EMPTY));
  }

  @Function
  public static int maximumInt(final int... values) {
    return Arrays.stream(values).max().orElseThrow(() -> new IllegalStateException(ERR_EMPTY));
  }

  @Function
  public static float minimumFloat(final float... values) {
    if (values == null || values.length == 0) {
      throw new IllegalArgumentException(ERR_EMPTY);
    }
    float min = values[0];
    if (values.length > 1) {
      for (int i = 1; i < values.length; i++) {
        float value = values[i];
        min = Math.min(value, min);
      }
    }
    return min;
  }

  @Function
  public static float maximumFloat(final float... values) {
    if (values == null || values.length == 0) {
      throw new IllegalArgumentException(ERR_EMPTY);
    }
    float max = values[0];
    if (values.length > 1) {
      for (int i = 1; i < values.length; i++) {
        float value = values[i];
        max = Math.max(value, max);
      }
    }
    return max;
  }

}
