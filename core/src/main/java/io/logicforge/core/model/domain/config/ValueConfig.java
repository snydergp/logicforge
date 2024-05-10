package io.logicforge.core.model.domain.config;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

@EqualsAndHashCode(callSuper = false)
@Data
@Builder
@RequiredArgsConstructor
public class ValueConfig extends ExpressionConfig {

  private final String value;
  private final String typeId;

}
