package io.logicforge.core.model.specification;

public interface FunctionSpec extends MethodSpec {

  String getName();

  Class<?> getOutputType();

}
