package io.logicforge.core.model.domain.config;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@RequiredArgsConstructor
public class ProcessConfig<INTERFACE, ID> {

  private final Class<INTERFACE> functionalInterface;

  private final ID id;

  private final String name;

  private final BlockConfig rootBlock;

  private final ExpressionConfig returnStatement;

}
