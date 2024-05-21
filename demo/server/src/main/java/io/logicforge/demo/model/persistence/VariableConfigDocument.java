package io.logicforge.demo.model.persistence;

import lombok.Builder;
import lombok.Data;
import lombok.ToString;

@Data
@Builder
@ToString
public class VariableConfigDocument {

  private String title;
  private String description;

}
