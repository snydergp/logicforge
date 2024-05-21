package io.logicforge.demo.model.persistence;

import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;
import lombok.ToString;

@EqualsAndHashCode(callSuper = true)
@Data
@RequiredArgsConstructor
@ToString
public abstract class ControlStatementConfigDocument extends ExecutableConfigDocument {

  public abstract List<BlockConfigDocument> getBlocks();

}
