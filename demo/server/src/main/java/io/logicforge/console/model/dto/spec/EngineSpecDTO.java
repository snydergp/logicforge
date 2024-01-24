package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class EngineSpecDTO implements SpecDTO {

  private Map<String, ProcessSpecDTO> processes;
  private Map<String, TypeSpecDTO> types;
  private Map<String, ActionSpecDTO> actions;
  private Map<String, FunctionSpecDTO> functions;

  @Override
  public SpecType getType() {
    return SpecType.ENGINE;
  }
}
