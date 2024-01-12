package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DefaultActionConfig implements ActionConfig {

  private String name;
  @Builder.Default
  private Map<String, List<ActionConfig>> actionArguments = new HashMap<>();
  @Builder.Default
  private Map<String, List<InputConfig>> inputArguments = new HashMap<>();
}
