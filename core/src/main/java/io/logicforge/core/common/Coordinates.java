package io.logicforge.core.common;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.Data;

@Data
public final class Coordinates implements Iterable<Integer> {

  private static final Map<List<Integer>, Coordinates> INTERNAL = new HashMap<>();

  public static final Coordinates ROOT = intern(Collections.emptyList());

  public static Coordinates from(final List<Integer> coordinateList) {
    return intern(coordinateList);
  }

  public static Coordinates from(final int[] coordinateList) {
    return intern(Arrays.stream(coordinateList).boxed().collect(Collectors.toList()));
  }

  public static Coordinates from(final Integer... coordinates) {
    return intern(Arrays.stream(coordinates).collect(Collectors.toList()));
  }

  /**
   * Since Coordinates objects are immutable and iterating throw parents/children would otherwise
   * create a lot of object churn, we maintain an internal cache. This method returns the canonical
   * version of the Coordinates object representing the supplied coordinate list if it exists. If it
   * does not exist, it will create a new object, cache it for reuse, and return the new object.
   *
   * @param coordinateList the list of coordinates for which we want that canonical Coordinates
   *                       object
   * @return the corresponding Coordinates
   */
  private static Coordinates intern(final List<Integer> coordinateList) {
    Coordinates internal = INTERNAL.get(coordinateList);
    if (internal == null) {
      final List<Integer> internalListCopy = new ArrayList<>(coordinateList);
      internal = new Coordinates(internalListCopy);
      INTERNAL.put(internalListCopy, internal);
    }
    return internal;
  }

  private final List<Integer> coordinateList;

  private Coordinates(final List<Integer> coordinates) {
    this.coordinateList = coordinates;
  }

  private Coordinates(final int[] coordinates) {
    this.coordinateList = Arrays.stream(coordinates).boxed().collect(Collectors.toList());
  }

  public Coordinates getParent() {
    final int size = coordinateList.size();
    if (size == 0) {
      throw new IllegalStateException("Attempted to find the parent of the root coordinates");
    }
    return intern(coordinateList.subList(0, size - 1));
  }

  public Coordinates getNthChild(final int childIndex) {
    return intern(Stream.concat(coordinateList.stream(), Stream.of(childIndex))
        .collect(Collectors.toList()));
  }

  public Coordinates getSibling(final int siblingIndex) {
    final int size = coordinateList.size();
    return intern(Stream.concat(coordinateList.subList(0, size - 1).stream(), Stream.of(
        siblingIndex)).collect(Collectors.toList()));
  }

  public Coordinates getAncestor() {
    final int length = coordinateList.size();
    final int lastSegment = coordinateList.get(length - 1);
    if (lastSegment > 0) {
      return getSibling(lastSegment - 1);
    } else {
      return getParent();
    }
  }

  public Integer getFinalIndex() {
    final int size = coordinateList.size();
    if (size == 0) {
      throw new IllegalStateException(
          "Attempted to find the final segment of the root coordinates");
    }
    return coordinateList.get(size - 1);
  }

  public int size() {
    return coordinateList.size();
  }

  @Override
  public Iterator<Integer> iterator() {
    return coordinateList.iterator();
  }

  @Override
  public String toString() {
    return "[" + asFormattedString(",") + "]";
  }

  public String asFormattedString(final String separator) {
    return coordinateList.stream().map(Objects::toString).collect(Collectors.joining(separator));
  }

  public List<Integer> asList() {
    return coordinateList;
  }

  public int[] asArray() {
    return coordinateList.stream().mapToInt(Integer::intValue).toArray();
  }
}
