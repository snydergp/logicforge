package io.logicforge.core.annotations.metadata;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Allows the setting of categories on action/function methods. Categories are metadata used by the
 * frontend to collect like operations together for easier browsing. This annotation can be used
 * either directly on the relevant action/function method, or on the containing class. If both are
 * annotated, the method takes precedence.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface Category {

  String value();

}
