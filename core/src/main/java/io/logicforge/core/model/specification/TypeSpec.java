package io.logicforge.core.model.specification;

import java.util.List;
import java.util.Set;

public interface TypeSpec {

  Class<?> getRuntimeClass();

  List<String> getValues();

  Set<String> getSupertypes();

}
