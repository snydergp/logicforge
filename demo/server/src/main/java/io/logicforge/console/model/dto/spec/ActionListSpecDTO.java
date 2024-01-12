package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActionListSpecDTO extends ParameterSpecDTO {

    @Override
    public SpecType getType() {
        return SpecType.ACTION_LIST;
    }
}
