package io.logicforge.core.model.domain.config;

import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = false)
@Data
@SuperBuilder
public abstract class ControlStatementConfig extends ExecutableConfig {

  private final ControlStatementType type;

  private final List<BlockConfig> blocks;

}
