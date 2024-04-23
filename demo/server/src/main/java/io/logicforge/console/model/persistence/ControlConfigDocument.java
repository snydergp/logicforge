package io.logicforge.console.model.persistence;

import io.logicforge.core.model.configuration.ControlStatementConfig;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ControlConfigDocument extends ExecutableConfigDocument {

  private final ControlStatementConfig.Type type;
  private final List<BlockConfigDocument> blocks;

}
