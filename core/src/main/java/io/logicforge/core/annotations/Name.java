package io.logicforge.core.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Used to define or override the name used to identify a method (action or function) or a parameter. By default, the
 * inspector will use the name of the method itself, or the parameter (if the class was compiled with the "-parameter"
 * option. This annotation will override that behavior.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.PARAMETER})
public @interface Name {

  String value();

}
