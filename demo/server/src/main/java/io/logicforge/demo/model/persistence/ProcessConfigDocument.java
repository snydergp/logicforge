package io.logicforge.demo.model.persistence;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@Document
public class ProcessConfigDocument extends org.bson.Document {

  @Id
  private UUID id;
  private String name;
  private BlockConfigDocument rootBlock;
  private ExpressionConfigDocument returnStatement;

}