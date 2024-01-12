package io.logicforge.console.model.dto.spec;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public abstract class ParameterSpecDTO implements SpecDTO {

    private String name;
}
