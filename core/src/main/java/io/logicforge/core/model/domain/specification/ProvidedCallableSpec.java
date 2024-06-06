package io.logicforge.core.model.domain.specification;

import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ProvidedCallableSpec extends CallableSpec {

  private final Object provider;
  private final Map<String, Object> metadata;

}
