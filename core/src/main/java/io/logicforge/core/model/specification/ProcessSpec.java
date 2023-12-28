package io.logicforge.core.model.specification;

import java.util.List;

public interface ProcessSpec {

  String getTitle();

  String getDescription();

  List<ContextVariableSpec> getAvailableVariables();

}
