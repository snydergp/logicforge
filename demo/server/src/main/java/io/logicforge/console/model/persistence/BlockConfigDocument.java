package io.logicforge.console.model.persistence;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BlockConfigDocument {

  private List<ExecutableConfigDocument> executables;
}
