package io.logicforge.core.exception;

public class UnexpectedVariableException extends ProcessExecutionException {

  public UnexpectedVariableException() {
    // TODO try to capture variable title, type, and requested path for debugging
    super("Attempted to resolve a variable but found a variable of unexpected type");
  }
}
