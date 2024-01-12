package io.logicforge.core.model.configuration;

import java.util.Map;

public interface ActionConfig {

  String getName();

  Map<String, ArgumentConfig> getArguments();
}
