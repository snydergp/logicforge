package io.logicforge.core.model.specification;

import java.util.List;

public interface TypeSpec {

  Class<?> getRuntimeClass();

  List<String> getValues();

}
