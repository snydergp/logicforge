package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InputListConfigDocument extends ArgumentConfigDocument {

    private List<InputConfigDocument> inputs;
}
