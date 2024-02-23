package io.logicforge.core.common;

import lombok.AccessLevel;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class OneOf<LEFT, RIGHT> {

  public static <L, R> OneOf<L, R> nullable(final L left, final R right) {
    if (left == null && right == null) {
      throw new NullPointerException("Both arguments cannot be null");
    } else if (left != null && right != null) {
      throw new NullPointerException("Both arguments cannot be non-null");
    }
    return new OneOf<>(left, right);
  }

  private final LEFT left;
  private final RIGHT right;

  public boolean isLeft() {
    return left != null;
  }

  public boolean isRight() {
    return right != null;
  }

  public LEFT getLeft() {
    if (left == null) {
      throw new NullPointerException();
    }
    return left;
  }

  public RIGHT getRight() {
    if (right == null) {
      throw new NullPointerException();
    }
    return right;
  }

}
