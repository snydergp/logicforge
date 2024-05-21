package io.logicforge.core.model.domain.specification;

import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Builder
@RequiredArgsConstructor
public class TypeSpec {

  private final Class<?> runtimeClass;

  private final List<String> values;

  private final Set<String> supertypes;

  private final Map<String, TypePropertySpec> properties;

  private final boolean valueType;

}
