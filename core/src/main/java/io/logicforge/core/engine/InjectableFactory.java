package io.logicforge.core.engine;


import io.logicforge.core.injectable.ExecutionContext;

public interface InjectableFactory {
    /*
     * PRE-RELEASE: What's the best way to make this extendable? It seems like passing in the execution
     * context might be useful in some cases.
     */
    <T> T getInjectable(final Class<T> type, final ExecutionContext executionContext);

    interface Builtin extends InjectableFactory {

    }

}
