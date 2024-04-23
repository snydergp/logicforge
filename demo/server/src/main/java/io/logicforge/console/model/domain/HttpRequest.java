package io.logicforge.console.model.domain;

import io.logicforge.core.annotations.elements.CompoundType;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
@Builder
@CompoundType
public class HttpRequest {

  private final String path;

  private HttpMethod method;

}
