package io.logicforge.core.common;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@EqualsAndHashCode
@Getter
public class Pair<LEFT, RIGHT> {

  private final LEFT left;
  private final RIGHT right;

  @Override
  public String toString() {
    return "Pair{" + left + ", " + right + "}";
  }

}
