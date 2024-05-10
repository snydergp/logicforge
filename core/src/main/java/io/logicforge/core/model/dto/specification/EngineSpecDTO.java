package io.logicforge.core.model.dto.specification;

import io.logicforge.core.constant.ControlStatementType;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EngineSpecDTO {

  private Map<String, CallableSpecDTO> processes;
  private Map<String, TypeSpecDTO> types;
  private Map<String, CallableSpecDTO> actions;
  private Map<String, CallableSpecDTO> functions;
  private List<ControlStatementType> controls;

}
