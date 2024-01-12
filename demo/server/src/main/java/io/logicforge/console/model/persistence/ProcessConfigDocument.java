package io.logicforge.console.model.persistence;

import lombok.Builder;
import lombok.Data;
import org.bson.BsonDocument;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@Document
public class ProcessConfigDocument extends BsonDocument {

    @Id
    private UUID id;
    private List<ActionConfigDocument> actions;

}
