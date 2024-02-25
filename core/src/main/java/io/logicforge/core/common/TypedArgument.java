package io.logicforge.core.common;

import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * TypedArgument defines an argument for a method or constructor. Used in resolving the appropriate method/constructor
 * when the argument type differs from the defined type (e.g., the argument is a subtype of the defined type)
 */
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode
@Getter
public class TypedArgument {

    public static TypedArgument from(final Class<?> type, final Object argument) {
        return new TypedArgument(type, argument);
    }

    public static TypedArgument from(final Object argument) {
        return new TypedArgument(argument.getClass(), argument);
    }

    private final Class<?> type;
    private final Object argument;

}
