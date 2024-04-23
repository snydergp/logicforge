package io.logicforge.console.model.persistence;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class ActionConfigDocument extends ExecutableConfigDocument {

  private String name;
  private Map<String, List<InputConfigDocument>> inputs;
}
