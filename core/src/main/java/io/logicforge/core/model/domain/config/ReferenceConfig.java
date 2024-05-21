package io.logicforge.core.model.domain.config;

import io.logicforge.core.common.Coordinates;
import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class ReferenceConfig extends ExpressionConfig {

  private final Coordinates coordinates;

  private final List<String> path;

}
