package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class FunctionSpecDTO implements SpecDTO {

    private String name;
    private String returnType;
    public Map<String, ComputedParameterSpecDTO> parameters;

    @Override
    public SpecType getType() {
        return SpecType.FUNCTION;
    }
}
