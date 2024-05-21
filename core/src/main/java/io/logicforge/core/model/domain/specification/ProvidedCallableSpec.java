package io.logicforge.core.model.domain.specification;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ProvidedCallableSpec extends CallableSpec {

  private final Object provider;

}
