package io.logicforge.core.builtin.actions;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.engine.ExecutionContext;

import java.util.Arrays;
import java.util.Objects;

public class ConditionalActions {

  public Object defaultValue(Object[] optionalValues, final Object fallbackValue) {
    return Arrays.stream(optionalValues).filter(Objects::nonNull).findFirst().orElse(fallbackValue);
  }

}
