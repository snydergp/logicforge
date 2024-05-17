package io.logicforge.demo.model.persistence;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@Document
@ToString
public class ProcessConfigDocument {

  @Id
  private UUID id;
  private String name;
  private BlockConfigDocument rootBlock;
  private List<ExpressionConfigDocument> returnStatement;

}
