package io.logicforge.core.model.settings;

import java.time.Duration;
import java.util.Map;

public interface EngineSettings {

  Duration getDefaultActionTimeout();

  Map<String, ActionSettings> getActionSettings();
}
