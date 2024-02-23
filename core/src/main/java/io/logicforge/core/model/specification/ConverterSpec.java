package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Method;
import java.util.List;

@Data
@Builder
@RequiredArgsConstructor
public class ConverterSpec {

  private final Class<?> outputType;

  private final Class<?> inputType;

  private final Method method;

  private final Object provider;

  private final List<InputSpec> inputs;

}
