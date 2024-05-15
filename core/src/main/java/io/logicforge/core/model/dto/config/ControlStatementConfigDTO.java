package io.logicforge.core.model.dto.config;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.logicforge.core.constant.ConfigType;
import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "controlType")
@JsonSubTypes({@Type(value = ConditionalConfigDTO.class, name = "CONDITIONAL")})
public class ControlStatementConfigDTO extends ExecutableConfigDTO {


  private ControlStatementType controlType;

  private List<BlockConfigDTO> blocks;

  @Override
  public final ConfigType getDifferentiator() {
    return ConfigType.CONTROL_STATEMENT;
  }
}
