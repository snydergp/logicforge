package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ComputedParameterSpecDTO extends ParameterSpecDTO {

    private String returnType;
    private boolean multi;

    @Override
    public SpecType getType() {
        return SpecType.PARAMETER;
    }
}
