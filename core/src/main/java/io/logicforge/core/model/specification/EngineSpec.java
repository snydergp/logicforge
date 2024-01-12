package io.logicforge.core.model.specification;

import java.util.Map;

public interface EngineSpec {

  Map<String, TypeSpec> getTypes();

  Map<String, ActionSpec> getActions();

  Map<String, FunctionSpec> getFunctions();

  Map<String, ConverterSpec> getConverters();
}
