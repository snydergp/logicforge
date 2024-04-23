package io.logicforge.console.model.domain;

import io.logicforge.core.model.configuration.BlockConfig;
import io.logicforge.core.model.configuration.ExpressionConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import java.util.UUID;
import lombok.Getter;

/**
 * Augments the ProcessConfig model with a UUID used for persistence
 */
@Getter
public class ExtendedProcessConfig extends ProcessConfig<DemoProcess> {

  private final UUID id;

  public ExtendedProcessConfig(final Class<DemoProcess> functionalInterface, final String name,
      final BlockConfig rootBlock, final ExpressionConfig returnStatement, final UUID id) {
    super(functionalInterface, name, rootBlock, returnStatement);
    this.id = id;
  }
}
