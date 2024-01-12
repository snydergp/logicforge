package io.logicforge.console.repository;

import io.logicforge.console.model.ProcessConfigDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProcessConfigRepository extends MongoRepository<ProcessConfigDocument, String> {
    @Override
    Optional<ProcessConfigDocument> findById(String s);
}
