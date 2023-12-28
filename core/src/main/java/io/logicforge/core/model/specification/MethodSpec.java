package io.logicforge.core.model.specification;

import java.lang.invoke.MethodHandle;
import java.util.List;

public interface MethodSpec {

  MethodHandle getMethodHandle();

  Object getProvider();

  List<ParameterSpec> getParameters();

}
