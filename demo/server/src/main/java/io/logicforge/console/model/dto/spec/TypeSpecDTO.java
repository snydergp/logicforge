package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TypeSpecDTO implements SpecDTO {

    private String id;
    private List<String> parentIds;
    private List<String> values;

    @Override
    public SpecType getType() {
        return SpecType.TYPE;
    }
}
