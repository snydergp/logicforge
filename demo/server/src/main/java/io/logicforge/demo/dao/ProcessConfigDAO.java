package io.logicforge.demo.dao;

import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.demo.model.domain.WebServerProcess;
import java.util.Optional;
import java.util.UUID;

public interface ProcessConfigDAO {

  void save(final ProcessConfig<WebServerProcess, UUID> processConfig);

  Optional<ProcessConfig<WebServerProcess, UUID>> getById(final UUID id);

  void delete(final UUID id);

}
