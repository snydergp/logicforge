package io.logicforge.core.model.specification;

public interface ContextVariableSpec {

  String getTitle();

  String getDescription();

  Class<?> getType();

  boolean isOptional();

}
