package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.ActionListConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import lombok.Data;

@Data
public class DefaultProcessConfig implements ProcessConfig {

  private String name;
  private ActionListConfig actions;
}
