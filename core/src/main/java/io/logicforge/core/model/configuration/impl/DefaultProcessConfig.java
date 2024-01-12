package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import lombok.Data;

import java.util.List;

@Data
public class DefaultProcessConfig implements ProcessConfig {

  private String name;
  private List<ActionConfig> actions;
}
