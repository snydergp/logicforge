package io.logicforge.core.annotations.elements;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Used to indicate a method that should be exposed as a function. Functions expose generic
 * capabilities, taking in
 * multiple inputs as arguments. Inputs are resolved from preconfigured child elements at runtime.
 * Depending on
 * configuration, these resolving elements might from a named context variable, a static value, or
 * returned from another
 * function.<br>
 * <br>
 *
 * For functions that leverage execution context variables, an
 * {@link com.github.snydergp.computationconfig.model.ExecutionContext} parameter may also be
 * defined.<br>
 * <br>
 *
 * Notes:<br>
 * - Function methods must be thread-safe<br>
 * - All input parameters on a function method must be annotated with {@link javax.inject.Named} to
 * allow mapping to the
 * correct resolver<br>
 * - Function methods should not have side-effects (use {@link Action} for those cases)<br>
 * - Function methods must return a value (void methods are not allowed)<br>
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Function {

}
