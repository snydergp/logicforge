package io.logicforge.demo.model.domain;

import io.logicforge.core.engine.Process;

public interface WebServerProcess extends Process {

  HttpResponse respond(final HttpRequest request);

}
