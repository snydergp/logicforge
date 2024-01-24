package io.logicforge.core.model.specification;

import java.util.List;
import java.util.Map;

public interface EngineSpec {

  Map<String, ProcessSpec> getProcesses();

  Map<String, TypeSpec> getTypes();

  Map<String, ActionSpec> getActions();

  Map<String, FunctionSpec> getFunctions();

  List<ConverterSpec> getConverters();
}
