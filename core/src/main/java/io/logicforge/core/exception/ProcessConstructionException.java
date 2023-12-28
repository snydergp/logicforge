package io.logicforge.core.exception;

public class ProcessConstructionException extends Exception {
  public ProcessConstructionException() {}

  public ProcessConstructionException(final String message) {
    super(message);
  }

  public ProcessConstructionException(final String message, final Throwable cause) {
    super(message, cause);
  }

  public ProcessConstructionException(final Throwable cause) {
    super(cause);
  }

  public ProcessConstructionException(final String message, final Throwable cause,
      final boolean enableSuppression, final boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }
}
