package io.logicforge.core.model.specification;

import io.logicforge.core.annotations.Action;
import io.logicforge.core.annotations.Converter;
import io.logicforge.core.annotations.Function;
import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.annotations.Name;
import io.logicforge.core.common.Pair;
import io.logicforge.core.constant.EngineMethodType;
import io.logicforge.core.util.EngineMethodUtil;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodHandles;
import java.lang.invoke.MethodHandles.Lookup;
import java.lang.invoke.MethodType;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class EngineSpecBuilder {

    private final Map<String, TypeSpec> types = new HashMap<>();
    private final Map<String, ActionSpec> actions = new HashMap<>();
    private final Map<String, FunctionSpec> functions = new HashMap<>();
    private final Map<String, ConverterSpec> converters = new HashMap<>();

    private final Map<Pair<EngineMethodType, Class<?>>, Optional<InjectedParameterSpec>> injectableCache
            = new HashMap<>();

    /**
     * Adds methods annotated on the provider object's class to this builder. Only methods annotated with
     * {@link io.logicforge.core.annotations.Action}, {@link io.logicforge.core.annotations.Function}, or
     * {@link io.logicforge.core.annotations.Converter} will be processed. Instance methods, and optionally static
     * methods, will be processed. Any instance method calls will be executed against the provided instance.<br><br>
     *
     * All annotated methods will be checked for validity. An exception will be thrown if errors are found.
     * @param provider the provider instance
     * @return this builder instance
     */
    public EngineSpecBuilder withProviderInstance(final Object provider, final boolean processStaticMethods) {
        if (provider instanceof Class<?>) {
            throw new IllegalArgumentException("Attempted to pass class instance to withProviderInstance method.");
        }

        final Class<?> providerClass = provider.getClass();
        Arrays.stream(providerClass.getMethods()).forEach(method -> processMethod(method, provider));
        if (processStaticMethods) {
            withProviderClass(providerClass);
        }

        return this;
    }

    public EngineSpecBuilder withProviderClass(final Class<?> providerClass) {
        Arrays.stream(providerClass.getMethods()).forEach(method -> processMethod(method, providerClass));
        return this;
    }

    public EngineSpecBuilder withAction(final ActionSpec actionSpec) {
        actions.put(actionSpec.getName(), actionSpec);
        return this;
    }

    public EngineSpecBuilder withFunction(final FunctionSpec functionSpec) {
        functions.put(functionSpec.getName(), functionSpec);
        return this;
    }

    public EngineSpec build() {
        return new EngineSpecImpl(types, actions, functions, converters);
    }

    private void processMethod(final Method method, final Object instanceOrClass) {
        final boolean processStatic = instanceOrClass instanceof Class<?>;
        if (processStatic == isMethodStatic(method)) {
            final Optional<Pair<EngineMethodType, Object>> optionalAnnotation = EngineMethodUtil.analyzeMethod(method);
            if (optionalAnnotation.isPresent()) {
                final Pair<EngineMethodType, Object> annotation = optionalAnnotation.get();
                switch (annotation.getLeft()) {
                    case ACTION -> processAction(method, instanceOrClass, (Action) annotation.getRight());
                    case FUNCTION -> processFunction(method, instanceOrClass, (Function) annotation.getRight());
                    case CONVERTER -> processConverter(method, instanceOrClass, (Converter) annotation.getRight());
                }
            }
        }
    }

    /*
     * FUTURE: Convert primitive wrappers to canonical type
     */
    private void processType(final Class<?> type) {
        final Class<?> typeToProcess = type.isArray() ? type.getComponentType() : type;
        final String className = type.getName();
        if (!types.containsKey(className)) {
            final boolean primitive = typeToProcess.isPrimitive();
            final List<String> values;
            if (typeToProcess.isEnum()) {
                values = Arrays.stream((Enum[]) typeToProcess.getEnumConstants())
                        .map(Enum::name)
                        .collect(Collectors.toList());
            } else {
                values = null;
            }
            types.put(className, new TypeSpecImpl(type, primitive, values));
        }
    }

    private void processAction(final Method method, final Object provider, final Action annotation) {
        final Class<?> returnType = method.getReturnType();
        if (!Void.class.equals(returnType)) {
            throw new IllegalStateException(String.format("Action-annotated method %s has a non-void return type", method));
        }
        final String name = getNameForMethod(method);
        final MethodHandle methodHandle = getHandleForMethod(method, provider);
        final List<ParameterSpec> parameterSpecs = processParameters(method, annotation);
        final ActionSpec actionSpec = new ActionSpecImpl(name, methodHandle, provider, parameterSpecs);
        actions.put(name, actionSpec);
    }

    private void processFunction(final Method method, final Object provider, final Function annotation) {
        final Class<?> returnType = method.getReturnType();
        if (Void.class.equals(returnType)) {
            throw new IllegalStateException(String.format("Function-annotated method %s has a void return type", method));
        }
        final String name = getNameForMethod(method);
        final MethodHandle methodHandle = getHandleForMethod(method, provider);
        final List<ParameterSpec> parameterSpecs = processParameters(method, annotation);
        final FunctionSpec functionSpec = new FunctionSpecImpl(name, returnType, methodHandle, provider, parameterSpecs);
        functions.put(name, functionSpec);
        processType(returnType);
    }

    private void processConverter(final Method method, final Object instanceOrClass, final Converter annotation) {

    }

    private List<ParameterSpec> processParameters(final Method method, final Object annotation) {
        final EngineMethodType methodType = EngineMethodUtil.getTypeForAnnotation(annotation).get();
        final Parameter[] parameters = method.getParameters();
        return Arrays.stream(parameters)
                .map(parameter -> processParameter(parameter, methodType))
                .collect(Collectors.toList());
    }

    private ParameterSpec processParameter(final Parameter parameter, final EngineMethodType methodType) {
        final Class<?> parameterType = parameter.getType();
        final Optional<InjectedParameterSpec> injectedParameter = getInjectedParameter(parameterType, methodType);
        if (injectedParameter.isPresent()) {
            return injectedParameter.get();
        }
        final String name = getNameForParameter(parameter);
        final boolean multi = parameterType.isArray();
        final Class<?> type = multi ? parameterType.getComponentType() : parameterType;
        return new ComputedParameterSpecImpl(name, multi, type);
    }

    private Optional<InjectedParameterSpec> getInjectedParameter(final Class<?> parameterType, final EngineMethodType methodType) {
        final Pair<EngineMethodType, Class<?>> key = new Pair<>(methodType, parameterType);
        return injectableCache.computeIfAbsent(key, k -> {
            final Injectable annotation = parameterType.getAnnotation(Injectable.class);
            if (annotation != null) {
                if (Arrays.asList(annotation.methodTypes()).contains(methodType)) {
                    return Optional.of(new InjectedParameterSpecImpl(parameterType));
                }
            }
            return Optional.empty();
        });
    }

    private static MethodHandle getHandleForMethod(final Method method, final Object provider) {
        final Lookup lookup = MethodHandles.lookup();
        final MethodHandle methodHandle;
        try {
            if (isMethodStatic(method) && provider instanceof Class) {
                methodHandle = lookup.findStatic((Class<?>) provider, method.getName(), getTypeForMethod(method));
            } else if (!isMethodStatic(method) && !(provider instanceof Class)) {
                final Class<?> providerClass = provider.getClass();
                methodHandle = lookup.findVirtual(providerClass, method.getName(), getTypeForMethod(method));
            } else {
                throw new IllegalStateException("Attempted to process method using illegal provider");
            }
        } catch (NoSuchMethodException | IllegalAccessException e) {
            throw new RuntimeException("Failed to get method handle for method" + method, e);
        }
        return methodHandle;
    }

    private static MethodType getTypeForMethod(final Method method) {
        return MethodType.methodType(method.getReturnType(), method.getParameterTypes());
    }

    private static String getNameForMethod(final Method method) {
        final Name name = method.getAnnotation(Name.class);
        return name != null ? name.value() : method.getName();
    }

    private static boolean isMethodStatic(final Method method) {
        return Modifier.isStatic(method.getModifiers());
    }

    private static String getNameForParameter(final Parameter parameter) {
        final Name name = parameter.getAnnotation(Name.class);
        return name != null ? name.value() : parameter.getName();
    }

    @Getter
    private static class EngineSpecImpl implements EngineSpec {

        private final Map<String, TypeSpec> types;
        private final Map<String, ActionSpec> actions;
        private final Map<String, FunctionSpec> functions;
        private final Map<String, ConverterSpec> converters;

        public EngineSpecImpl(final Map<String, TypeSpec> types, final Map<String, ActionSpec> actions, final Map<String, FunctionSpec> functions, final Map<String, ConverterSpec> converters) {
            this.types = Collections.unmodifiableMap(types);
            this.actions = Collections.unmodifiableMap(actions);
            this.functions = Collections.unmodifiableMap(functions);
            this.converters = Collections.unmodifiableMap(converters);
        }
    }

    @Getter
    @AllArgsConstructor
    private static class ActionSpecImpl implements ActionSpec {

        private final String name;
        private final MethodHandle methodHandle;
        private final Object provider;
        private final List<ParameterSpec> parameters;
    }

    @Getter
    @AllArgsConstructor
    private static class FunctionSpecImpl implements FunctionSpec {

        private final String name;
        private final Class<?> outputType;
        private final MethodHandle methodHandle;
        private final Object provider;
        private final List<ParameterSpec> parameters;
    }

    @Getter
    @AllArgsConstructor
    private static class TypeSpecImpl implements TypeSpec {

        private final Class<?> runtimeClass;
        private final boolean primitive;
        private final List<String> values;
    }

    @Getter
    @AllArgsConstructor
    private static class ComputedParameterSpecImpl implements ComputedParameterSpec {

        private final String name;
        private final boolean multi;
        private final Class<?> type;
    }

    @Getter
    @AllArgsConstructor
    private static class InjectedParameterSpecImpl implements InjectedParameterSpec {

        private final Class<?> type;
    }

}
