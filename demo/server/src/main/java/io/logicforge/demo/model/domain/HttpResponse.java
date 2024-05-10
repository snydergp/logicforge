package io.logicforge.demo.model.domain;

import io.logicforge.core.annotations.elements.CompoundType;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
@Builder
@CompoundType
public class HttpResponse {

  private final String body;

  private final int status;

}
