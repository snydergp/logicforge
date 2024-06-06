package io.logicforge.core.builtin.operations;

import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.annotations.metadata.Category;
import io.logicforge.core.constant.WellKnownCategories;

@Category(WellKnownCategories.TEXT)
public class TextOperations {

  @Function
  public static String concatenate(final String join, final String... values) {
    return String.join(join, values);
  }

  @Function
  public static String reverseText(final String text) {
    return new StringBuffer(text).reverse().toString();
  }

  @Function
  public static String truncateText(final String text, final double length) {
    return text.substring(0, (int) length);
  }

  @Function
  public static boolean textContains(final String text, final String testSubstring) {
    return text.contains(testSubstring);
  }

  @Function
  public static double matchCount(final String text, final String testSubstring) {
    if (testSubstring.isEmpty()) {
      throw new RuntimeException("This function requires a non-empty string");
    }
    final int substringLength = testSubstring.length();
    final int lengthDiff = text.length() - text.replace(testSubstring, "").length();
    // since we're using a double-only number system, we are knowingly doing int division
    //  (numbers will always be multiples) and returning the result as a double
    return lengthDiff / substringLength;
  }

  @Function
  public static double findOffset(final String text, final String testSubstring) {
    return text.indexOf(text);
  }

}
