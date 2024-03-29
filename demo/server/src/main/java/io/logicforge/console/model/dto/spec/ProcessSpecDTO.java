package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProcessSpecDTO implements SpecDTO {

  private String name;

  @Override
  public SpecType getType() {
    return SpecType.PROCESS;
  }
}
