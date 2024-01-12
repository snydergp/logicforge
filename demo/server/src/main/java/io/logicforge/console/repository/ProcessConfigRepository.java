package io.logicforge.console.repository;

import io.logicforge.console.model.persistence.ProcessConfigDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProcessConfigRepository extends MongoRepository<ProcessConfigDocument, UUID> {
    @Override
    Optional<ProcessConfigDocument> findById(final UUID key);
}
