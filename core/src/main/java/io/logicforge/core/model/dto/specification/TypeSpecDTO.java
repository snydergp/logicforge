package io.logicforge.core.model.dto.specification;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TypeSpecDTO {

  private String id;
  private List<String> supertypes;
  private List<String> values;
  private boolean valueType;
  private Map<String, TypePropertySpecDTO> properties;

}
