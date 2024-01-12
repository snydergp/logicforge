package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.InputListConfig;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DefaultFunctionConfig implements FunctionConfig {

  private String name;
  private Map<String, InputListConfig> arguments;
}
