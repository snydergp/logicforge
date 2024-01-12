package io.logicforge.core.model.specification;

import java.lang.reflect.Method;
import java.util.List;

public interface MethodSpec {

  Method getMethod();

  Object getProvider();

  List<ParameterSpec> getParameters();

}
