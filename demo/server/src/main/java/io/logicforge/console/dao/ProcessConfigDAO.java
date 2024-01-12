package io.logicforge.console.dao;

import io.logicforge.console.model.domain.ExtendedProcessConfig;

import java.util.Optional;
import java.util.UUID;

public interface ProcessConfigDAO {

    void save(final ExtendedProcessConfig processConfig);

    Optional<ExtendedProcessConfig> getById(final UUID id);

    void delete(final UUID id);

}
