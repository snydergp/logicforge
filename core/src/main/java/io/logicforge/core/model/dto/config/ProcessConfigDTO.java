package io.logicforge.core.model.dto.config;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.ToString;

@Data
@Builder
@ToString
public class ProcessConfigDTO {

  private String name;
  private BlockConfigDTO rootBlock;
  private List<ExpressionConfigDTO> returnExpression;
  private Object externalId;

}
