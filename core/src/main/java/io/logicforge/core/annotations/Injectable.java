package io.logicforge.core.annotations;

import io.logicforge.core.constant.EngineMethodType;
import io.logicforge.core.engine.InjectableFactory;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Injectable {

  EngineMethodType[] methodTypes();

  Class<? extends InjectableFactory> factory() default InjectableFactory.Builtin.class;

}
