package io.logicforge.core.model.specification;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@RequiredArgsConstructor
public class TypeSpec {

  private final Class<?> runtimeClass;

  private final List<String> values;

  private final Set<String> supertypes;

  private final Map<String, TypePropertySpec> properties;

}
