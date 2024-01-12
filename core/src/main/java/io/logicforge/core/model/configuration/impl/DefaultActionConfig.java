package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.ArgumentConfig;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DefaultActionConfig implements ActionConfig {

  private String name;
  private Map<String, ArgumentConfig> arguments;
}
