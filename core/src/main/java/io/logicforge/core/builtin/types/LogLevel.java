package io.logicforge.core.builtin.types;

import lombok.Getter;
import org.slf4j.event.Level;

@Getter
public enum LogLevel {

  ERROR(Level.ERROR), WARN(Level.WARN), INFO(Level.INFO);

  private final Level mappedLevel;

  LogLevel(final Level mappedLevel) {
    this.mappedLevel = mappedLevel;
  }

}
