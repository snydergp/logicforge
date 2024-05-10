package io.logicforge.demo.model.persistence;

import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@RequiredArgsConstructor
public abstract class ControlStatementConfigDocument extends ExecutableConfigDocument {


  public abstract ControlStatementType getType();

  public abstract List<BlockConfigDocument> getBlocks();

}
