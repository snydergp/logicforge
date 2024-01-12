package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class FunctionConfigDocument extends InputConfigDocument {

    private String name;
    private Map<String, InputListConfigDocument> arguments;
}
