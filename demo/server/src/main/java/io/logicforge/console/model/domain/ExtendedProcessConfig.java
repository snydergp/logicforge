package io.logicforge.console.model.domain;

import io.logicforge.core.model.configuration.impl.DefaultProcessConfig;
import lombok.Data;

import java.util.UUID;

/**
 * Augments the ProcessConfig model with a UUID used for persistence
 */
@Data
public class ExtendedProcessConfig extends DefaultProcessConfig {

    private UUID id;
}
