package io.logicforge.core.constant;

import io.logicforge.core.annotations.Action;
import io.logicforge.core.annotations.Converter;
import io.logicforge.core.annotations.Function;
import lombok.Getter;

public enum EngineMethodType {
  ACTION(Action.class), FUNCTION(Function.class), CONVERTER(Converter.class);

  @Getter
  private final Class<?> annotationType;

  EngineMethodType(final Class<?> annotationType) {
    this.annotationType = annotationType;
  }
}
