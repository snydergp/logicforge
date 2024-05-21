package io.logicforge.core.exception;

public class ConversionException extends ProcessExecutionException {

  public ConversionException(final Object value, final Class<?> outputType, final String message) {
    // TODO try to capture variable title, type, and requested path for debugging
    super("Failed to convert %s to %s: %s".formatted(value, outputType, message));
  }

  public ConversionException(final Object value, final Class<?> outputType, final String message,
      final Throwable cause) {
    // TODO try to capture variable title, type, and requested path for debugging
    super("Failed to convert %s to %s: %s".formatted(value, outputType, message), cause);
  }
}
