package io.logicforge.core.annotations.action;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
public @interface SetsVariable {

  String title() default "";

  String description() default "";

  Class<?> type() default SetsVariable.class; // using this class as placeholder

}
