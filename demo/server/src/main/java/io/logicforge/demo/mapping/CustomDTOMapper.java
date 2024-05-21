package io.logicforge.demo.mapping;

import io.logicforge.core.mapping.DTOMapper;
import io.logicforge.core.model.domain.specification.EngineSpec;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Custom DTO mapper that adds Spring component bindings and maps internal UUIDs to/from external
 * String representation
 */
@Component
public class CustomDTOMapper extends DTOMapper<UUID> {

  @Autowired
  public CustomDTOMapper(EngineSpec engineSpec) {
    super(engineSpec);
  }

  @Override
  protected Object externalId(UUID internalId) {
    return internalId.toString();
  }

  @Override
  protected UUID internalID(Object externalId) {
    return UUID.fromString(String.valueOf(externalId));
  }
}
