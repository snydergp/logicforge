package io.logicforge.core.exception;

public class MissingVariableException extends ProcessExecutionException {

  public MissingVariableException() {
    // TODO try to capture variable title, type, and requested path for debugging
    super("Attempted to resolve an optional variable or variable property that was not set.");
  }
}
