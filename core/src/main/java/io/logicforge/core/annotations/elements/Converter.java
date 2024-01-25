package io.logicforge.core.annotations.elements;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A Converter is a method that takes in a single value of one type and outputs a value of another type, with the
 * intention that the output value is a canonical, consistent representation of the input value in the output type
 * space. For example the text "23" can be converted to the integer 23. <br>
 * <br>
 * Conversions are used in cases where functions/actions receive incompatible types as inputs. If a text-concatenation
 * function receives the inputs 23.4 (a decimal) and true (a boolean), conversions allow us to assume the intention is
 * to use the text representations of those values, rather than simply throwing an exception. Conversions are one-way,
 * and not all type pairings allow conversion, and even conversions between supported types can fail (e.g., trying to
 * convert the text "abc" to an integer).
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Converter {

}
