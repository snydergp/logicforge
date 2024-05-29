package io.logicforge.core.builtin.operations;

import io.logicforge.core.annotations.elements.Function;
import java.util.Arrays;

public class MathOperations {

  private static final String ERR_EMPTY = "this function requires at least one input value";

  @Function
  public static double minimumDouble(final double... values) {
    return Arrays.stream(values).min().orElseThrow(() -> new RuntimeException(ERR_EMPTY));
  }

  @Function
  public static double maximumDouble(final double... values) {
    return Arrays.stream(values).min().orElseThrow(() -> new RuntimeException(ERR_EMPTY));
  }

  @Function
  public static double sumDoubles(final double... values) {
    return Arrays.stream(values).sum();
  }

  @Function
  public static double differenceDoubles(final double a, final double b) {
    return a - b;
  }

  @Function
  public static double negateDouble(final double value) {
    return -value;
  }

  @Function
  public static double multiplyDoubles(final double... values) {
    return Arrays.stream(values).reduce(1D, (a, b) -> a * b);
  }

  @Function
  public static double[] sortDoubles(final double... values) {
    return Arrays.stream(values).sorted().toArray();
  }

  @Function
  public static double[] reverseSortDoubles(final double... values) {
    final double[] ordered = Arrays.stream(values).sorted().toArray();
    // DoubleStream doesn't provide a means to reverse order -- this loop reverses in place
    for (int i = 0; i < ordered.length / 2; i++) {
      double temp = ordered[i];
      ordered[i] = ordered[ordered.length - i - 1];
      ordered[ordered.length - i - 1] = temp;
    }
    return ordered;
  }

  @Function
  public static double averageDoubles(final double... values) {
    if (values.length == 0) {
      throw new RuntimeException(ERR_EMPTY);
    }
    return sumDoubles(values) / (double) values.length;
  }

  @Function
  public static boolean isLessThanDouble(final double test, final double reference) {
    return test < reference;
  }

  @Function
  public static boolean isGreaterThanDouble(final double test, final double reference) {
    return test > reference;
  }

  @Function
  public static boolean isLessThanOrEqualDouble(final double test, final double reference) {
    return test <= reference;
  }

  @Function
  public static boolean isGreaterThanOrEqualDouble(final double test, final double reference) {
    return test >= reference;
  }

  @Function
  public static double exponentDouble(final double base, final double exponent) {
    return Math.pow(base, exponent);
  }

  @Function
  public static double roundDouble(final double value) {
    return Math.round(value);
  }

  @Function
  public static double ceilingDouble(final double value) {
    return Math.ceil(value);
  }

  @Function
  public static double floorDouble(final double value) {
    return Math.floor(value);
  }

  private static boolean isDouble(final Number number) {
    return number.getClass().equals(Double.class);
  }

}
