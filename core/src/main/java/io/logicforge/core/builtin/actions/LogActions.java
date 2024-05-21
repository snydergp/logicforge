package io.logicforge.core.builtin.actions;


import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.builtin.types.LogLevel;
import org.slf4j.LoggerFactory;

public class LogActions {

  public static final String DEFAULT_LOGGER = LogActions.class.getName();

  @Action
  public static void log(final String message, final LogLevel logLevel) {
    /*
     * FUTURE: allow injection of execution properties object into methods to allow adding (for example) process ID,
     * execution ID, tenant ID, etc.
     */
    LoggerFactory.getLogger(DEFAULT_LOGGER).atLevel(logLevel.getMappedLevel()).log(message);
  }

}
