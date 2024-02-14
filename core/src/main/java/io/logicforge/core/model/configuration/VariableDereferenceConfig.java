package io.logicforge.core.model.configuration;

public interface VariableDereferenceConfig extends InputConfig {

    int getIndex();

    String[] getPath();

}
