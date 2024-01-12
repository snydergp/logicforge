package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ActionConfigDocument {

    private String name;
    private Map<String, ArgumentConfigDocument> arguments;
}
