package io.logicforge.core.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.Arrays;
import java.util.stream.Collectors;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class CoordinateUtils {

  public static String formatCoordinatesAsArrayInitializer(final int[] coordinateArray) {
    return "new int[]{" + Arrays.stream(coordinateArray).mapToObj(Integer::toString)
        .collect(Collectors.joining(",")) + "}";
  }

  public static String formatCoordinatesAsVariableFragment(final int[] coordinateArray) {
    return Arrays.stream(coordinateArray).mapToObj(Integer::toString)
        .collect(Collectors.joining("_"));
  }

  /**
   * Gets the "depth-first ancestor", or the coordinates of the element that would have been returned previously to the
   * provided element in a depth-first search. (e.g. [2,1] => [2,0] or [2,0] => [2]). Useful when trying to enforce strict
   * ordering of actions.
   *
   * @param coordinates
   * @return
   */
  public static int[] getAncestor(final int[] coordinates) {
    final int length = coordinates.length;
    if (length == 0) {
      throw new IllegalStateException("The root coordinates have no ancestor");
    }
    final int finalCoordinate = coordinates[length - 1];
    if (finalCoordinate == 0) {
      return Arrays.copyOf(coordinates, length - 1);
    } else {
      final int[] siblingCoordinates = Arrays.copyOf(coordinates, length);
      siblingCoordinates[length - 1] = finalCoordinate - 1;
      return siblingCoordinates;
    }
  }

  public static int[] getNthChild(final int[] parentCoordinates, int childIndex) {
    final int length = parentCoordinates.length;
    final int[] childCoordinates = Arrays.copyOf(parentCoordinates, length + 1);
    childCoordinates[length] = childIndex;
    return childCoordinates;
  }

}
