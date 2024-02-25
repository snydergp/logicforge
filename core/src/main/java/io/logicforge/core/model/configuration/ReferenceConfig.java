package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.Singular;

import java.util.List;

@Data
@Builder
@RequiredArgsConstructor
public class ReferenceConfig extends ExpressionConfig {


  @Data
  @Builder
  @RequiredArgsConstructor
  public static class Reference {

    private final List<Integer> coordinateList;

    private final List<String> path;

  }

  @Singular private final List<Reference> references;

  private final ExpressionConfig fallback;

}
