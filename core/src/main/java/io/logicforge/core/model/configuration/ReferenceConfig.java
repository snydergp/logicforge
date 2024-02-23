package io.logicforge.core.model.configuration;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Data
@Builder
@RequiredArgsConstructor
public class ReferenceConfig extends ExpressionConfig {


  @Data
  @Builder
  @RequiredArgsConstructor
  public static class Reference {

    private final int[] coordinates;

    private final String[] path;

  }

  private final List<Reference> references;

  private final ExpressionConfig fallback;

}
