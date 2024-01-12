package io.logicforge.core.annotations;

public @interface DynamicParameter {

  String name();

  Class<?> type();

  boolean multi() default false;

}
