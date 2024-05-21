package io.logicforge.core.model.domain.specification;

import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Builder
@RequiredArgsConstructor
public class EngineSpec {

  private final Map<String, CallableSpec> processes;

  private final Map<String, TypeSpec> types;

  private final Map<String, ProvidedCallableSpec> actions;

  private final Map<String, ProvidedCallableSpec> functions;

  private final List<ControlStatementType> controls;

  private final List<ConverterSpec> converters;
}
