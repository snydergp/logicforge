package io.logicforge.core.exception;

public class EngineConfigurationException extends Exception {
  public EngineConfigurationException() {
    super();
  }

  public EngineConfigurationException(final String message) {
    super(message);
  }

  public EngineConfigurationException(final String message, final Throwable cause) {
    super(message, cause);
  }

  public EngineConfigurationException(final Throwable cause) {
    super(cause);
  }

  protected EngineConfigurationException(final String message, final Throwable cause,
      final boolean enableSuppression, final boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }
}
