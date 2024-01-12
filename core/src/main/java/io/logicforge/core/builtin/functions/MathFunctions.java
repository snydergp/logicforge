package io.logicforge.core.builtin.functions;

import io.logicforge.core.annotations.Function;
import io.logicforge.core.annotations.Input;
import io.logicforge.core.annotations.Property;

import java.util.Arrays;
import java.util.Comparator;

public class MathFunctions {

  @Function
  public static <T extends Number & Comparable<Number>> T minimum(final T... values) {
    return Arrays.stream(values).min(Comparator.naturalOrder()).orElseThrow(RuntimeException::new); // TODO checked exception before
  }

  @Function
  public static <T extends Number & Comparable<Number>> T maximum(final T... values) {
    return Arrays.stream(values).max(Comparator.naturalOrder()).orElseThrow(RuntimeException::new); // TODO checked exception before
  }

  @Function
  public static Number product(final Number... values) {
    return Arrays.stream(values).reduce(MathFunctions::multiply).orElse(1L);
  }

  @Function
  public static Number sum(final Number... values) {
    return Arrays.stream(values).reduce(MathFunctions::add).orElse(0L);
  }

  @Function
  public static Long staticLong(
      @Input(properties = @Property(name = "editor", value = "integer")) final Long value) {
    return value;
  }

  @Function
  public static Double staticDouble(
      @Input(properties = @Property(name = "editor", value = "float")) final Double value) {
    return value;
  }

  private static Number multiply(final Number a, final Number b) {
    if (a instanceof Double || b instanceof Double) {
      return a.doubleValue() * b.doubleValue();
    } else {
      return a.intValue() * b.intValue();
    }
  }

  private static Number add(final Number a, final Number b) {
    if (a instanceof Double || b instanceof Double) {
      return a.doubleValue() + b.doubleValue();
    } else {
      return a.intValue() + b.intValue();
    }
  }


}
