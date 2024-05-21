package io.logicforge.core.model.domain.specification;

import java.lang.reflect.Method;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class CallableSpec extends ExpressionSpec {

  private final String name;
  private final Method method;
  private final List<InputSpec> inputs;

}
