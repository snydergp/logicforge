package io.logicforge.core.builtin;

import io.logicforge.core.builtin.actions.LogActions;
import io.logicforge.core.builtin.actions.VariableActions;
import io.logicforge.core.builtin.converters.BooleanConverters;
import io.logicforge.core.builtin.converters.DecimalConverters;
import io.logicforge.core.builtin.converters.IntegerConverters;
import io.logicforge.core.builtin.converters.StringConverters;
import io.logicforge.core.builtin.functions.LogicFunctions;
import io.logicforge.core.builtin.functions.MathFunctions;
import io.logicforge.core.builtin.functions.TextFunctions;
import io.logicforge.core.model.domain.specification.EngineSpecBuilder;
import java.util.List;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class BuiltinProviders {

  private static final List<Class<?>> BUILTIN_PROVIDERS = List.of(VariableActions.class,
      LogActions.class, BooleanConverters.class, DecimalConverters.class, IntegerConverters.class,
      StringConverters.class, LogicFunctions.class, MathFunctions.class, TextFunctions.class);

  /**
   * Returns an array of all action/function/converter provider classes. This class array can be
   * ingested by {@link EngineSpecBuilder#withProviderClasses(Class[])} to build an engine
   * specification with all builtin methods.
   *
   * @return an array of all builtin method provider classes
   */
  public static Class<?>[] getAll() {
    return BUILTIN_PROVIDERS.toArray(new Class[0]);
  }

}
