package io.logicforge.core.model.configuration;

public interface ValueConfig extends InputConfig {

  String getValue();

  Class<?> getType();
}
