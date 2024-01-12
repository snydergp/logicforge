package io.logicforge.core.model.configuration.impl;

import io.logicforge.core.model.configuration.InputConfig;
import io.logicforge.core.model.configuration.InputListConfig;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DefaultInputListConfig implements InputListConfig {

  private List<InputConfig> inputs;
}
