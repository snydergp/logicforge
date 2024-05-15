package io.logicforge.core.model.dto.config;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "differentiator")
@JsonSubTypes({@Type(value = ActionConfigDTO.class, name = "ACTION"), @Type(
    value = ControlStatementConfigDTO.class, name = "CONTROL")})
public abstract class ExecutableConfigDTO implements ConfigDTO {


}
