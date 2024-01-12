package io.logicforge.core.util;

import io.logicforge.core.common.Pair;
import io.logicforge.core.constant.EngineMethodType;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class EngineMethodUtil {

  public static Optional<Pair<EngineMethodType, Object>> analyzeMethod(final Method method) {
    final List<Pair<EngineMethodType, Object>> annotatedTypes =
        Arrays.stream(EngineMethodType.values())
            .map(methodType -> new Pair<EngineMethodType, Object>(methodType,
                method.getAnnotation(methodType.getAnnotationType())))
            .filter(pair -> Objects.nonNull(pair.getRight())).collect(Collectors.toList());

    if (annotatedTypes.size() > 1) {
      final String annotationClassList = annotatedTypes.stream().map(Pair::getRight)
          .map(Object::getClass).map(Class::toString).collect(Collectors.joining(", "));
      throw new IllegalStateException(
          String.format("Method %s has multiple annotations where only one is permitted: %s",
              method, annotationClassList));
    }

    return annotatedTypes.isEmpty() ? Optional.empty() : Optional.of(annotatedTypes.get(0));
  }

  public static Optional<EngineMethodType> getTypeForAnnotation(final Object annotation) {
    if (annotation == null) {
      return Optional.empty();
    }
    final Class<?> annotationType = annotation.getClass();
    return Arrays.stream(EngineMethodType.values())
        .filter(type -> Objects.equals(type, annotationType)).findFirst();
  }
}
