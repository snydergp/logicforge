package io.logicforge.core.model.domain.config;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Builder
@RequiredArgsConstructor
public class VariableConfig {

  private final String title;

  private final String description;
}
