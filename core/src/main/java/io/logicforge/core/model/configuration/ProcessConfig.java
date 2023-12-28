package io.logicforge.core.model.configuration;

import java.util.List;

public interface ProcessConfig {

  String getName();

  List<ActionConfig> getActions();

}
