package io.logicforge.console.model.persistence;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.bson.BsonDocument;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@Document
public class ProcessConfigDocument extends BsonDocument {

  @Id
  private UUID id;
  private String name;
  private BlockConfigDocument rootBlock;

}
