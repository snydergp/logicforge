package io.logicforge.core.util;

import io.logicforge.core.common.Pair;
import io.logicforge.core.constant.EngineMethodType;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class EngineMethodUtil {

  public static Optional<EngineMethodType> analyzeMethod(final Method method) {
    final List<EngineMethodType> annotatedTypes = Arrays.stream(EngineMethodType.values())
        .filter(type -> method.getAnnotation(type.getAnnotationType()) != null)
        .toList();


    if (annotatedTypes.size() > 1) {
      final String annotationClassList = annotatedTypes.stream()
          .map(EngineMethodType::getAnnotationType)
          .map(Class::getName)
          .collect(Collectors.joining(", "));
      throw new IllegalStateException(
          "Method %s has multiple annotations where only one is permitted: %s".formatted(method,
              annotationClassList));
    }

    return annotatedTypes.isEmpty() ? Optional.empty() : Optional.of(annotatedTypes.get(0));
  }

}
