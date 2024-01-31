package io.logicforge.core.annotations.metadata;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * For function parameters whose type should match the constraints of the parameter to which the function's output is
 * being passed. For example, an "if" function takes in a boolean test parameter, and two branch values of any type
 * (representing "then" and "else"). This flexibility allows the function to be used as an input for any parameter
 * (eliminating the need to have separate "if" functions for every type), however to ensure the parent parameter is
 * satisfied, both the "then" and "else" values must match the output parameter's type constraints. This flag is used to
 * inform the frontend where that constraint needs to be enforced.
 *
 * @return true, if the configuration for this parameter should match output constraints
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.PARAMETER})
public @interface MatchOutputType {

}
