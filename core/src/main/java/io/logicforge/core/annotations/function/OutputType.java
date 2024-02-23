package io.logicforge.core.annotations.function;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * <p>
 * Defines a function's output type dynamically in terms of one or more of it's input parameters, allowing static type
 * analysis to better better specify the kinds of values the function will produce at runtime.
 * </p>
 * <p>
 * While most functions provide a single statically-defined output type (e.g., String), it is possible for functions to
 * declare a generic type, but return a more specific type at runtime based on one or more input types. For example, an
 * "if" function might take in a boolean "test" parameter, and two branch values of any type (representing "then" and
 * "else"). This flexibility allows the function to be used for any parameter types (eliminating the need to have
 * separate "if" functions for every type), however it requires that the function itself be defined with a return type
 * of Object, which tends not to be useful. This annotation can be used to mark one or more parameters as a potential
 * output type for the function. This allows us to infer the specific output type in place of the more-generic declared
 * type.
 * </p>
 * <p>
 * This annotation can be use on any computed parameter of a Function-annotated method. If more than one parameter is
 * annotated, they will be restricted to the same type. Any annotated parameter should be a subtype of the function's
 * declared return type.
 * </p>
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface OutputType {
}
