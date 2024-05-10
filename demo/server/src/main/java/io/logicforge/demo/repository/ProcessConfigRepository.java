package io.logicforge.demo.repository;

import io.logicforge.demo.model.persistence.ProcessConfigDocument;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProcessConfigRepository extends MongoRepository<ProcessConfigDocument, UUID> {

  @Override
  Optional<ProcessConfigDocument> findById(final UUID key);
}
