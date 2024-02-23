package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@Data
@Builder
@RequiredArgsConstructor
public class ProcessSpec {

  private final String name;

  private final List<VariableSpec> inputVariables;

  private final InputSpec outputType;

}
