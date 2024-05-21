package io.logicforge.core.model.domain.config;

import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = false)
@Data
@SuperBuilder
public class ActionConfig extends ExecutableConfig {

  private final String name;

  private final Map<String, List<ExpressionConfig>> arguments;

  private final VariableConfig output;

}
