package io.logicforge.core.injectable.impl;

import io.logicforge.core.injectable.ExecutionContext;
import io.logicforge.core.injectable.ModifiableExecutionContext;

import java.util.HashMap;
import java.util.Map;

public class DefaultModifiableExecutionContext implements ModifiableExecutionContext {

  private final Map<String, Object> variables = new HashMap<>();
  private ReadonlyView readonlyView;

  public DefaultModifiableExecutionContext() {
    this(new HashMap<>());
  }

  public DefaultModifiableExecutionContext(final Map<String, Object> initialState) {
    variables.putAll(initialState);
    readonlyView = new ReadonlyView();
  }

  @Override
  public boolean contains(final String name) {
    return variables.containsKey(name);
  }

  @Override
  public Object get(final String name, final Object defaultValue) {
    return contains(name) ? get(name) : defaultValue;
  }

  @Override
  public Object get(final String name) {
    return variables.get(name);
  }

  @Override
  public void set(final String name, final Object value) {
    variables.put(name, value);
  }

  @Override
  public void delete(final String name) {
    variables.remove(name);
  }

  @Override
  public ExecutionContext getReadonlyView() {
    return readonlyView;
  }

  private class ReadonlyView implements ExecutionContext {

    @Override
    public boolean contains(final String name) {
      return DefaultModifiableExecutionContext.this.contains(name);
    }

    @Override
    public Object get(final String name, final Object defaultValue) {
      return DefaultModifiableExecutionContext.this.get(name, defaultValue);
    }

    @Override
    public Object get(final String name) {
      return DefaultModifiableExecutionContext.this.get(name);
    }
  }
}
