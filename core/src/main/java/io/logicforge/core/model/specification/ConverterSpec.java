package io.logicforge.core.model.specification;

public interface ConverterSpec extends MethodSpec {

  Class<?> getInputType();

  Class<?> getOutputType();

}
