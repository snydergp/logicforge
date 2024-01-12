package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.ValueConfig;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DefaultValueConfig implements ValueConfig {

  private String value;
  private String typeId;
}
