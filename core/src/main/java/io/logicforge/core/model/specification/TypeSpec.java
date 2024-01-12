package io.logicforge.core.model.specification;

import java.util.List;

public interface TypeSpec {

  Class<?> getRuntimeClass();

  boolean isPrimitive();

  List<String> getValues();

}
