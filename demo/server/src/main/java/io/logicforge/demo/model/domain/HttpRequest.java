package io.logicforge.demo.model.domain;

import io.logicforge.core.annotations.elements.CompoundType;
import io.logicforge.core.annotations.elements.Property;
import lombok.Builder;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Builder
@CompoundType
public class HttpRequest {

  @Property
  private final String uri;

  @Property
  private final HttpMethod method;

  public String getUri() {
    return uri;
  }

  public HttpMethod getMethod() {
    return method;
  }
}
