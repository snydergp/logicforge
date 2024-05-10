package io.logicforge.demo.model.persistence;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class BlockConfigDocument extends ExecutableConfigDocument {

  private List<ExecutableConfigDocument> executables;
}
