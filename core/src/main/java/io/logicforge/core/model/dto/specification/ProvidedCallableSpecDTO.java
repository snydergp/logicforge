package io.logicforge.core.model.dto.specification;

import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ProvidedCallableSpecDTO extends CallableSpecDTO {

  private Map<String, Object> metadata;

}
