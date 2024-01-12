package io.logicforge.core.engine;

import io.logicforge.core.injectable.ModifiableExecutionContext;

import java.util.concurrent.Future;

public interface Process {

  Future<Void> execute(final ModifiableExecutionContext context);

}
