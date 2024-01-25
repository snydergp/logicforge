package io.logicforge.core.model.specification;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.elements.Converter;
import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.annotations.runtime.Injectable;
import io.logicforge.core.annotations.metadata.Name;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class EngineSpecBuilder {

  private static java.util.function.Function<Class<?>, String> TYPE_ID_NAMING_STRATEGY =
      Class::getName;

  private final Map<String, ProcessSpec> processes = new HashMap<>();
  private final Set<Class<?>> types = new HashSet<>();
  private final Map<String, ActionSpec> actions = new HashMap<>();
  private final Map<String, FunctionSpec> functions = new HashMap<>();
  private final List<ConverterSpec> converters = new ArrayList<>();

  private final Map<Pair<EngineMethodType, Class<?>>, Optional<InjectedParameterSpec>> injectableCache =
      new HashMap<>();

  /**
   * Adds methods annotated on the provider object's class to this builder. Only methods annotated with
   * {@link Action}, {@link Function}, or
   * {@link Converter} will be processed. Instance methods, and optionally static methods,
   * will be processed. Any instance method calls will be executed against the provided instance.<br>
   * <br>
   *
   * All annotated methods will be checked for validity. An exception will be thrown if errors are found.
   *
   * @param provider the provider instance
   * @return this builder instance
   */
  public EngineSpecBuilder withProviderInstance(final Object provider,
      final boolean processStaticMethods) {
    if (provider instanceof Class<?>) {
      throw new IllegalArgumentException(
          "Attempted to pass class instance to withProviderInstance method.");
    }

    final Class<?> providerClass = provider.getClass();
    Arrays.stream(providerClass.getMethods()).forEach(method -> processMethod(method, provider));
    if (processStaticMethods) {
      withProviderClass(providerClass);
    }

    return this;
  }

  public EngineSpecBuilder withProviderClasses(final Class<?>... providerClasses) {
    Arrays.stream(providerClasses).forEach(this::withProviderClass);
    return this;
  }

  public EngineSpecBuilder withProviderClass(final Class<?> providerClass) {
    Arrays.stream(providerClass.getMethods())
        .forEach(method -> processMethod(method, providerClass));
    return this;
  }

  public EngineSpecBuilder withProcess(final ProcessSpec process) {
    processes.put(process.getName(), process);
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
    return new EngineSpecImpl(processes, processTypes(), actions, functions, converters);
  }

  private void processMethod(final Method method, final Object instanceOrClass) {
    final boolean processStatic = instanceOrClass instanceof Class<?>;
    if (processStatic == isMethodStatic(method)) {
      final Optional<Pair<EngineMethodType, Object>> optionalAnnotation =
          EngineMethodUtil.analyzeMethod(method);
      if (optionalAnnotation.isPresent()) {
        final Pair<EngineMethodType, Object> annotation = optionalAnnotation.get();
        switch (annotation.getLeft()) {
          case ACTION -> processAction(method, instanceOrClass, (Action) annotation.getRight());
          case FUNCTION ->
            processFunction(method, instanceOrClass, (Function) annotation.getRight());
          case CONVERTER ->
            processConverter(method, instanceOrClass, (Converter) annotation.getRight());
        }
      }
    }
  }

  private void registerType(final Class<?> type) {
    final Class<?> typeToProcess = type.isArray() ? type.getComponentType() : type;
    types.add(typeToProcess);
  }

  /**
   * Processes all types found as actions/functions/converters were added. Processing is deferred until all types are
   * registered because we need to determine relationships between all types in the set.
   *
   * @return a collection of type specifications mapped by their IDs
   */
  private Map<String, TypeSpec> processTypes() {

    /* a mapping from runtime classes to the external type ID used to represent each class */
    final Map<Class<?>, String> typesByClass = types.stream()
        .collect(Collectors.toMap(java.util.function.Function.identity(), TYPE_ID_NAMING_STRATEGY));
    /* a mapping from type ID to a list of IDs for parent types */
    final Map<String, Set<String>> parentTypeIdMappings = buildParentTypeMappings(typesByClass);

    return types.stream().map(type -> {
      final String id = typesByClass.get(type);
      final boolean primitive = type.isPrimitive();
      final Set<String> supertypes =
          parentTypeIdMappings.computeIfAbsent(id, (i) -> new HashSet<>());
      final List<String> values;
      if (type.isEnum()) {
        values = Arrays.stream((Enum[]) type.getEnumConstants()).map(Enum::name)
            .collect(Collectors.toList());
      } else {
        values = new ArrayList<>();
      }
      return new TypeSpecImpl(type, primitive, new HashSet<>(supertypes), values);
    }).collect(Collectors.toMap(typeSpec -> typesByClass.get(typeSpec.getRuntimeClass()),
        java.util.function.Function.identity()));
  }


  private Map<String, Set<String>> buildParentTypeMappings(
      final Map<Class<?>, String> typesByClass) {
    final Map<String, Set<String>> parentMapping = new HashMap<>();

    // Find inheritance relationships. Runs in N*N time -- expensive, so should be cached
    for (final Entry<Class<?>, String> subtypeEntry : typesByClass.entrySet()) {
      final Class<?> subtypeClass = subtypeEntry.getKey();
      final String subtypeId = subtypeEntry.getValue();
      for (final Entry<Class<?>, String> supertypeEntry : typesByClass.entrySet()) {
        final Class<?> supertypeClass = supertypeEntry.getKey();
        final String supertypeId = supertypeEntry.getValue();

        if (subtypeId.equals(supertypeId)) {
          continue;
        }

        final Set<String> supertypes =
            parentMapping.computeIfAbsent(subtypeId, (k) -> new HashSet<>());

        if (supertypeClass.isAssignableFrom(subtypeClass)) {
          supertypes.add(supertypeId);
        }
      }
    }

    // Find conversion relationships. To simplify the frontend, we will consider types to which there exists a
    // conversion to be "supertypes", meaning the "input" type can be used in its place
    for (final ConverterSpec converter : converters) {
      final Class<?> inputType = converter.getInputType();
      final Class<?> outputType = converter.getOutputType();

      if (typesByClass.containsKey(inputType) && typesByClass.containsKey(outputType)) {
        final String subtypeId = typesByClass.get(inputType);
        final String supertypeId = typesByClass.get(outputType);
        final Set<String> supertypes =
            parentMapping.computeIfAbsent(subtypeId, (k) -> new HashSet<>());
        supertypes.add(supertypeId);
      }
    }

    return parentMapping;
  }

  private void processAction(final Method method, final Object provider, final Action annotation) {
    final Class<?> returnType = method.getReturnType();
    if (!void.class.equals(returnType)) {
      throw new IllegalStateException(String
          .format("Action-annotated method %s has a non-void return type: %s", method, returnType));
    }
    final String name = getNameForMethod(method);
    final List<ParameterSpec> parameterSpecs = processParameters(method, annotation);
    final ActionSpec actionSpec = new ActionSpecImpl(name, method, provider, parameterSpecs);
    actions.put(name, actionSpec);
  }

  private void processFunction(final Method method, final Object provider,
      final Function annotation) {
    final Class<?> returnType = method.getReturnType();
    if (Void.class.equals(returnType)) {
      throw new IllegalStateException(
          String.format("Function-annotated method %s has a void return type", method));
    }
    final String name = getNameForMethod(method);
    final List<ParameterSpec> parameterSpecs = processParameters(method, annotation);
    final FunctionSpec functionSpec =
        new FunctionSpecImpl(name, returnType, method, provider, parameterSpecs);
    functions.put(name, functionSpec);
    registerType(returnType);
  }

  private void processConverter(final Method method, final Object provider,
      final Converter annotation) {
    final Class<?> returnType = method.getReturnType();
    if (Void.class.equals(returnType)) {
      throw new IllegalStateException(
          String.format("Converter-annotated method %s has a void return type", method));
    }
    final List<ParameterSpec> parameterSpecs = processParameters(method, annotation);
    if (parameterSpecs.size() != 1) {
      throw new IllegalStateException(
          String.format("Converter-annotated method %s must have a single parameter", method));
    }
    final ParameterSpec parameterSpec = parameterSpecs.get(0);
    if (parameterSpec instanceof ComputedParameterSpec computedParameterSpec) {
      if (computedParameterSpec.isMulti()) {
        throw new IllegalStateException(
            String.format("Converter-annotated method %s must not use multi-parameters", method));
      }
      final Class<?> inputType = computedParameterSpec.getType();
      converters
          .add(new ConverterSpecImpl(inputType, returnType, method, provider, parameterSpecs));
    } else {
      throw new IllegalStateException(String
          .format("Converter-annotated method %s must not include injected parameters", method));
    }
  }

  private List<ParameterSpec> processParameters(final Method method, final Object annotation) {
    final EngineMethodType methodType = EngineMethodUtil.getTypeForAnnotation(annotation)
        .orElseThrow(() -> new IllegalStateException(String
            .format("Method %s with annotation %s is illegally defined", method, annotation)));
    final Parameter[] parameters = method.getParameters();
    return Arrays.stream(parameters).map(parameter -> processParameter(parameter, methodType))
        .collect(Collectors.toList());
  }

  private ParameterSpec processParameter(final Parameter parameter,
      final EngineMethodType methodType) {
    final Class<?> parameterType = parameter.getType();
    final String name = getNameForParameter(parameter);
    final Optional<InjectedParameterSpec> injectedParameter =
        getInjectedParameter(parameterType, methodType, name);
    if (injectedParameter.isPresent()) {
      return injectedParameter.get();
    }
    final boolean multi = parameterType.isArray();
    final Class<?> type = multi ? parameterType.getComponentType() : parameterType;
    registerType(type);
    return new ComputedParameterSpecImpl(name, multi, type);
  }

  private Optional<InjectedParameterSpec> getInjectedParameter(final Class<?> parameterType,
      final EngineMethodType methodType, final String name) {
    final Pair<EngineMethodType, Class<?>> key = new Pair<>(methodType, parameterType);
    return injectableCache.computeIfAbsent(key, k -> {
      final Injectable annotation = parameterType.getAnnotation(Injectable.class);
      if (annotation != null) {
        if (Arrays.asList(annotation.methodTypes()).contains(methodType)) {
          return Optional.of(new InjectedParameterSpecImpl(parameterType, name));
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
        methodHandle =
            lookup.findStatic((Class<?>) provider, method.getName(), getTypeForMethod(method));
      } else if (!isMethodStatic(method) && !(provider instanceof Class)) {
        final Class<?> providerClass = provider.getClass();
        methodHandle =
            lookup.findVirtual(providerClass, method.getName(), getTypeForMethod(method));
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

    private final Map<String, ProcessSpec> processes;
    private final Map<String, TypeSpec> types;
    private final Map<String, ActionSpec> actions;
    private final Map<String, FunctionSpec> functions;
    private final List<ConverterSpec> converters;

    public EngineSpecImpl(final Map<String, ProcessSpec> processes,
        final Map<String, TypeSpec> types, final Map<String, ActionSpec> actions,
        final Map<String, FunctionSpec> functions, final List<ConverterSpec> converters) {
      this.processes = Collections.unmodifiableMap(processes);
      this.types = Collections.unmodifiableMap(types);
      this.actions = Collections.unmodifiableMap(actions);
      this.functions = Collections.unmodifiableMap(functions);
      this.converters = Collections.unmodifiableList(converters);
    }
  }

  @Getter
  @AllArgsConstructor
  private static class ActionSpecImpl implements ActionSpec {

    private final String name;
    private final Method method;
    private final Object provider;
    private final List<ParameterSpec> parameters;
  }

  @Getter
  @AllArgsConstructor
  private static class FunctionSpecImpl implements FunctionSpec {

    private final String name;
    private final Class<?> outputType;
    private final Method method;
    private final Object provider;
    private final List<ParameterSpec> parameters;
  }

  @Getter
  @AllArgsConstructor
  private static class ConverterSpecImpl implements ConverterSpec {

    private final Class<?> inputType;
    private final Class<?> outputType;
    private final Method method;
    private final Object provider;
    private final List<ParameterSpec> parameters;
  }

  @Getter
  @AllArgsConstructor
  private static class TypeSpecImpl implements TypeSpec {

    private final Class<?> runtimeClass;
    private final boolean primitive;
    private final Set<String> supertypes;
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
    private final String name;
  }

}
