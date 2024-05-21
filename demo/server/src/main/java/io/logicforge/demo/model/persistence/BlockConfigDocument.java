package io.logicforge.demo.model.persistence;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@ToString
public class BlockConfigDocument extends ExecutableConfigDocument {

  private List<ExecutableConfigDocument> executables;
}
