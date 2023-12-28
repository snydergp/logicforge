package io.logicforge.core.exception;

public class ProcessExecutionException extends RuntimeException {
  public ProcessExecutionException() {}

  public ProcessExecutionException(final String message) {
    super(message);
  }

  public ProcessExecutionException(final String message, final Throwable cause) {
    super(message, cause);
  }

  public ProcessExecutionException(final Throwable cause) {
    super(cause);
  }

  public ProcessExecutionException(final String message, final Throwable cause,
      final boolean enableSuppression, final boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }
}
