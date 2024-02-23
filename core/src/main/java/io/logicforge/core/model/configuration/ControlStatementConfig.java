package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@EqualsAndHashCode(callSuper = false)
@Data
@RequiredArgsConstructor
public class ControlStatementConfig extends ExecutableConfig {

  public enum Type {
    CONDITIONAL;
  }

  private final Type type;

  private final List<BlockConfig> blocks;

}
