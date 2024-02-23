package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@RequiredArgsConstructor
public class EngineSpec {

  private final Map<String, ProcessSpec> processes;

  private final Map<String, TypeSpec> types;

  private final Map<String, ActionSpec> actions;

  private final Map<String, FunctionSpec> functions;

  private final List<ConverterSpec> converters;
}
