package io.logicforge.core.model.domain.config;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

@EqualsAndHashCode(callSuper = false)
@Data
@Builder
@RequiredArgsConstructor
public class FunctionConfig extends ExpressionConfig {

  private final String name;

  private final Map<String, List<ExpressionConfig>> arguments;
}
