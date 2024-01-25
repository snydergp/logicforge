package io.logicforge.core.annotations.elements;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotates a class as representing a runtime type. Non-primitive runtime types can be used as function return values,
 * and stored as context variables. When used as variables, their properties will be introspected for their values to be
 * read by functions or set by actions.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
public @interface Type {
}
