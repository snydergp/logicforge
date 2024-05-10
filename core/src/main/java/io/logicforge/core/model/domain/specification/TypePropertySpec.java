package io.logicforge.core.model.domain.specification;

import java.lang.reflect.Method;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Builder
@RequiredArgsConstructor
public class TypePropertySpec {

  private final String name;

  private final String typeId;

  private final boolean multi;

  private final boolean optional;

  private final Method getter;

}
