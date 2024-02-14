package io.logicforge.core.model.specification;

import java.lang.reflect.Method;
import java.util.Optional;

public interface TypePropertySpec {

    String getName();

    String getTypeId();

    boolean isOptional();

    Method getGetter();

    Method getSetter();

}
