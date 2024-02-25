package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Data
@Builder
@RequiredArgsConstructor
public class ProcessConfig<INTERFACE> {

  private final Class<INTERFACE> functionalInterface;

  private final String name;

  private final BlockConfig rootBlock;

  private final ExpressionConfig returnStatement;

  private final boolean allowConcurrency;

}
