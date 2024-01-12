package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValueConfigDocument extends InputConfigDocument {

    private String type;
    private String value;
}
