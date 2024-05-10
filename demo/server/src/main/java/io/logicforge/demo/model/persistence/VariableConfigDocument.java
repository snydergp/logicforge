package io.logicforge.demo.model.persistence;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.bson.BsonDocument;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class VariableConfigDocument extends BsonDocument {

  private String title;
  private String description;

}
