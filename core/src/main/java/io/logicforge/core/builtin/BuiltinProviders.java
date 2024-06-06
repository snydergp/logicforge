package io.logicforge.core.builtin;

import io.logicforge.core.builtin.converters.BooleanConverters;
import io.logicforge.core.builtin.converters.DecimalConverters;
import io.logicforge.core.builtin.converters.IntegerConverters;
import io.logicforge.core.builtin.converters.StringConverters;
import io.logicforge.core.builtin.operations.LocalDateTimeOperations;
import io.logicforge.core.builtin.operations.LoggingOperations;
import io.logicforge.core.builtin.operations.LogicOperations;
import io.logicforge.core.builtin.operations.MathOperations;
import io.logicforge.core.builtin.operations.MultiOperations;
import io.logicforge.core.builtin.operations.TextOperations;
import io.logicforge.core.builtin.operations.VariableOperations;
import io.logicforge.core.model.domain.specification.EngineSpecBuilder;
import java.util.List;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class BuiltinProviders {

  private static final List<Class<?>> BUILTIN_PROVIDERS = List.of(BooleanConverters.class,
      DecimalConverters.class, IntegerConverters.class, StringConverters.class,
      LogicOperations.class, MathOperations.class, TextOperations.class, VariableOperations.class,
      LoggingOperations.class, MultiOperations.class, LocalDateTimeOperations.class);

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
