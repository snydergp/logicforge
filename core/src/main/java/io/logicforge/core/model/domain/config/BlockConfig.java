package io.logicforge.core.model.domain.config;

import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = false)
@Data
@SuperBuilder
public class BlockConfig {

  private final List<ExecutableConfig> executables;
}
