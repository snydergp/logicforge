package io.logicforge.core.exception;

public class EngineInitializationException extends Exception {
  public EngineInitializationException(final String message) {
    super(message);
  }

  public EngineInitializationException(final String message, final Throwable cause) {
    super(message, cause);
  }
}
