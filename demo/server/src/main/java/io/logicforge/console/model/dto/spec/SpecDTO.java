package io.logicforge.console.model.dto.spec;

import io.logicforge.core.constant.SpecType;

/**
 * Interface used to provide polymorphic type differentiator field used by frontend to simplify parsing.
 */
public interface SpecDTO {


    SpecType getType();
}
