package io.logicforge.core.model.domain.config;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class ReferenceConfig extends ExpressionConfig {

  private final List<Integer> coordinateList;

  private final List<String> path;

}
