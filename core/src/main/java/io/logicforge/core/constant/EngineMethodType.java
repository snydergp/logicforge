package io.logicforge.core.constant;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.elements.Converter;
import io.logicforge.core.annotations.elements.Function;
import lombok.Getter;

import java.lang.annotation.Annotation;

public enum EngineMethodType {
  ACTION(Action.class), FUNCTION(Function.class), CONVERTER(Converter.class);

  @Getter
  private final Class<? extends Annotation> annotationType;

  EngineMethodType(final Class<? extends Annotation> annotationType) {
    this.annotationType = annotationType;
  }
}
