package io.logicforge.core.injectable.impl;

import io.logicforge.core.exception.MissingVariableException;
import io.logicforge.core.injectable.ExecutionContext;
import io.logicforge.core.injectable.ModifiableExecutionContext;

import java.util.*;

public class DefaultModifiableExecutionContext implements ModifiableExecutionContext {

  private final List<Optional<Object>> variables = new ArrayList<>();
  private ReadonlyView readonlyView;

  public DefaultModifiableExecutionContext() {
    this(new HashMap<>());
  }

  public DefaultModifiableExecutionContext(final List<Optional<Object>> initialState) {
    variables.addAll(initialState);
    readonlyView = new ReadonlyView();
  }

  @Override
  public boolean isSet(final int index, final String ... pathSegments) {
    if (variables.size() > index && variables.get(index).isPresent()) {

    }
    return false;
  }

  @Override
  public Object get(final int index, final String ... pathSegments) throws MissingVariableException {
    return
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
