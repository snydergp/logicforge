package io.logicforge.console.dao.impl;

import io.logicforge.console.dao.ProcessConfigDAO;
import io.logicforge.console.mapping.DocumentMapper;
import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.console.model.persistence.ProcessConfigDocument;
import io.logicforge.console.repository.ProcessConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

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
  public void save(final ExtendedProcessConfig processConfig) {
    final ProcessConfigDocument internal = mapper.internal(processConfig);
    repository.save(internal);
  }

  @Override
  public Optional<ExtendedProcessConfig> getById(final UUID id) {
    final Optional<ProcessConfigDocument> optionalInternal = repository.findById(id);
    return optionalInternal.map(mapper::external);
  }

  @Override
  public void delete(final UUID id) {
    repository.deleteById(id);
  }
}
