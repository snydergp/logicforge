package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

import java.util.List;

@EqualsAndHashCode(callSuper = false)
@Data
@Builder
@RequiredArgsConstructor
public class BlockConfig extends ExecutableConfig {

  private final List<ExecutableConfig> executables;
}
