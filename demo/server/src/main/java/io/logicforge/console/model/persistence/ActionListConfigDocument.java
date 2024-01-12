package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ActionListConfigDocument extends ArgumentConfigDocument {

    private List<ActionConfigDocument> actions;
}
