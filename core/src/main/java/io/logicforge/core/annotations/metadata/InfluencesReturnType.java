package io.logicforge.core.annotations.metadata;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * For function and action parameters, denotes a parameter that narrows the function/action output
 * type. For example
 * consider a function that returns one of its two inputs based on a boolean flag: <br>
 *
 * <code>
 * &#064;Function Object conditional(boolean test, Object then, Object else);
 * </code><br>
 * <p>
 * When analyzing the function, we will only be able to infer that it returns an Object type, even
 * when called with
 * String values <code>then</code> and <code>else</code>. This prevents that function call from
 * being used as an
 * argument requiring a String input. <br>
 * <br>
 * However, consider the following signature:<br>
 *
 * <code>
 * &#064;Function Object conditional(boolean test, &#064;InfluencesReturnType Object then,
 * &#064;InfluencesReturnType Object else);
 * </code><br>
 * <p>
 * The annotations inform the engine that the function's output type is narrowed to match the
 * <code>then</code> and
 * <code>else</code> parameter types, allowing the function to be used in cases where a more general
 * return type is not
 * allowed.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.PARAMETER})
public @interface InfluencesReturnType {

}
