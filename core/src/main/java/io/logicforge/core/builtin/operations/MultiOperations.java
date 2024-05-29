package io.logicforge.core.builtin.operations;

import io.logicforge.core.annotations.elements.Function;
import java.util.Arrays;

public class MultiOperations {

  @Function
  public static double findObject(final Object value, final Object[] values) {
    for (int i = 0; i < values.length; i++) {
      if (value.equals(values[i])) {
        return i;
      }
    }
    return -1;
  }

  @Function
  public static double countMatchingObjects(final Object match, final Object[] values) {
    return Arrays.stream(values).filter(match::equals).count();
  }

  @Function
  public static Object[] removeMatchingObjects(final Object match, final Object[] values) {
    return Arrays.stream(values).filter(value -> !match.equals(value)).toArray();
  }

  @Function
  public static boolean containsObject(final Object value, final Object[] values) {
    for (Object o : values) {
      if (value.equals(o)) {
        return true;
      }
    }
    return false;
  }

  @Function
  public static Object[] removeObjectByIndex(final double index, final Object[] values) {
    // Since we're using a double-only number system, the input index needs to be converted
    final int intIndex = (int) index;
    final Object[] left = Arrays.copyOfRange(values, 0, intIndex);
    final Object[] right = Arrays.copyOfRange(values, intIndex + 1, values.length);
    final Object[] out = new Object[values.length - 1];
    System.arraycopy(left, 0, out, 0, left.length);
    System.arraycopy(right, 0, out, left.length, right.length);
    return out;
  }

  @Function
  public static double objectListLength(final Object[] values) {
    return values.length;
  }

  @Function
  public static boolean isEqualObjects(final Object... values) {
    if (values.length <= 1) {
      return true;
    }
    final Object testValue = values[0];
    return Arrays.stream(values).skip(1).allMatch(testValue::equals);
  }

}
