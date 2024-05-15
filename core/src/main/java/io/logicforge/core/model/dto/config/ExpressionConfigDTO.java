package io.logicforge.core.model.dto.config;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "differentiator")
@JsonSubTypes({@Type(value = FunctionConfigDTO.class, name = "FUNCTION"), @Type(
    value = ReferenceConfigDTO.class, name = "REFERENCE"), @Type(value = ValueConfigDTO.class,
        name = "VALUE")})
public abstract class ExpressionConfigDTO implements ConfigDTO {

}
