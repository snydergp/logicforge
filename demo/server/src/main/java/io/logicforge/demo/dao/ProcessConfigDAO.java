package io.logicforge.demo.dao;

import io.logicforge.core.engine.Process;
import io.logicforge.core.model.domain.config.ProcessConfig;
import java.util.Optional;
import java.util.UUID;

public interface ProcessConfigDAO {

  void save(final ProcessConfig<?, UUID> processConfig);

  <T extends Process> Optional<ProcessConfig<T, UUID>> getById(final UUID id,
      final Class<T> processClass);

  void delete(final UUID id);

}
