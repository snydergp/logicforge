package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ActionSpecDTO implements SpecDTO {

  private String name;
  public Map<String, ActionListSpecDTO> actions;
  public Map<String, InputSpecDTO> inputs;

  @Override
  public SpecType getType() {
    return SpecType.ACTION;
  }
}
