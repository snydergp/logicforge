package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ActionConfigDocument {

    private String name;
    private Map<String, List<ActionConfigDocument>> actionArguments;
    private Map<String, List<InputConfigDocument>> inputArguments;
}
