package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.ActionListConfig;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DefaultActionListConfig implements ActionListConfig {

  private List<ActionConfig> actions;
}
