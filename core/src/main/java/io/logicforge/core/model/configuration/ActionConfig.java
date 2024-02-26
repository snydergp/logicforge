package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = false)
@Data
@Builder
@RequiredArgsConstructor
public class ActionConfig extends ExecutableConfig {

  private final String name;

  private final Map<String, List<ExpressionConfig>> arguments;

  private final VariableConfig output;

}
