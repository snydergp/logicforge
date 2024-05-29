package io.logicforge.core.builtin.operations;


import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.builtin.types.LogLevel;
import org.slf4j.LoggerFactory;

public class LoggingOperations {

  public static final String DEFAULT_LOGGER = LoggingOperations.class.getName();

  @Action
  public static void logMessage(final String message, final LogLevel logLevel) {
    /*
     * FUTURE: allow injection of "execution properties" object into methods to allow adding
     *  process ID, execution ID, tenant ID, etc. to the logs
     */
    LoggerFactory.getLogger(DEFAULT_LOGGER).atLevel(logLevel.getMappedLevel()).log(message);
  }

}
