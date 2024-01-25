package io.logicforge.core.model.specification;

import java.util.List;
import java.util.Optional;

public interface ProcessSpec {

  String getName();

  List<ContextVariableSpec> getAvailableVariables();

  Optional<ContextVariableSpec> getReturnValue();

}
