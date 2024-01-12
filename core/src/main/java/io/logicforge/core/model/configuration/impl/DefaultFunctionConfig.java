package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DefaultFunctionConfig implements FunctionConfig {

  private String name;
  private Map<String, List<InputConfig>> arguments;
}
