package io.logicforge.demo.dao.impl;

import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.demo.dao.ProcessConfigDAO;
import io.logicforge.demo.mapping.DocumentMapper;
import io.logicforge.demo.model.domain.WebServerProcess;
import io.logicforge.demo.model.persistence.ProcessConfigDocument;
import io.logicforge.demo.repository.ProcessConfigRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ProcessConfigDAOImpl implements ProcessConfigDAO {

  private final ProcessConfigRepository repository;
  private final DocumentMapper mapper;

  @Autowired
  public ProcessConfigDAOImpl(final ProcessConfigRepository repository,
      final DocumentMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public void save(final ProcessConfig<WebServerProcess, UUID> processConfig) {
    final ProcessConfigDocument internal = mapper.internal(processConfig);
    repository.save(internal);
  }

  @Override
  public Optional<ProcessConfig<WebServerProcess, UUID>> getById(final UUID id) {
    final Optional<ProcessConfigDocument> optionalInternal = repository.findById(id);
    return optionalInternal.map(mapper::external);
  }

  @Override
  public void delete(final UUID id) {
    repository.deleteById(id);
  }
}
