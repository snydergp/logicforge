package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;

@Data
@Builder
@RequiredArgsConstructor
public class ProcessSpec {

  private final String name;

  private final Method method;

  private final List<InputSpec> inputs;

  private final Class<?> outputType;

}
