package io.logicforge.core.model.configuration;

import java.util.Map;

public interface FunctionConfig extends InputConfig {

  String getName();

  Map<String, InputListConfig> getArguments();
}
