package io.logicforge.core.model.engine;

import java.util.List;

public interface EngineConfig {

    List<EngineStaticMethodReference> getStaticActions();

    List<EngineStaticMethodReference> getStaticFunctions();

    List<EngineStaticMethodReference> getStaticConverters();

}
