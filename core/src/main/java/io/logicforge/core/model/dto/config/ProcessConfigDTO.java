package io.logicforge.core.model.dto.config;

import io.logicforge.core.constant.ConfigType;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProcessConfigDTO implements ConfigDTO {

  private String name;
  private BlockConfigDTO rootBlock;
  private List<ExpressionConfigDTO> returnExpression;
  private Object externalId;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.PROCESS;
  }
}
