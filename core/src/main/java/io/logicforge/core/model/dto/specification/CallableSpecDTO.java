package io.logicforge.core.model.dto.specification;

import java.util.Map;
import lombok.Data;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public class CallableSpecDTO {

  private String name;
  private Map<String, InputSpecDTO> inputs;
  private ExpressionSpecDTO output;

}
