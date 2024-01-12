package io.logicforge.core.model.configuration;

import java.util.List;
import java.util.Map;

public interface ActionConfig {

  String getName();

  Map<String, List<ActionConfig>> getActionArguments();

  Map<String, List<InputConfig>> getInputArguments();
}
