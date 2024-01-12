package io.logicforge.console.mapping;

import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.console.model.dto.config.ActionConfigDTO;
import io.logicforge.console.model.dto.config.ActionListConfigDTO;
import io.logicforge.console.model.dto.config.ArgumentConfigDTO;
import io.logicforge.console.model.dto.config.FunctionConfigDTO;
import io.logicforge.console.model.dto.config.InputConfigDTO;
import io.logicforge.console.model.dto.config.InputListConfigDTO;
import io.logicforge.console.model.dto.config.ProcessConfigDTO;
import io.logicforge.console.model.dto.config.ValueConfigDTO;
import io.logicforge.console.model.dto.spec.ActionListSpecDTO;
import io.logicforge.console.model.dto.spec.ActionSpecDTO;
import io.logicforge.console.model.dto.spec.ComputedParameterSpecDTO;
import io.logicforge.console.model.dto.spec.EngineSpecDTO;
import io.logicforge.console.model.dto.spec.FunctionSpecDTO;
import io.logicforge.console.model.dto.spec.ParameterSpecDTO;
import io.logicforge.console.model.dto.spec.TypeSpecDTO;
import io.logicforge.core.common.Pair;
import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.ActionListConfig;
import io.logicforge.core.model.configuration.ArgumentConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import io.logicforge.core.model.configuration.InputListConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.configuration.impl.DefaultActionConfig;
import io.logicforge.core.model.configuration.impl.DefaultActionListConfig;
import io.logicforge.core.model.configuration.impl.DefaultFunctionConfig;
import io.logicforge.core.model.configuration.impl.DefaultInputListConfig;
import io.logicforge.core.model.configuration.impl.DefaultValueConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.ComputedParameterSpec;
import io.logicforge.core.model.specification.ConverterSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.InjectedParameterSpec;
import io.logicforge.core.model.specification.ParameterSpec;
import io.logicforge.core.model.specification.TypeSpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class DTOMapper {

    private final EngineSpec engineSpec;
    private final EngineSpecDTO cachedDTO;

    @Autowired
    public DTOMapper(final EngineSpec engineSpec) {
        this.engineSpec = engineSpec;

        final Map<String, TypeSpec> types = engineSpec.getTypes();
        final Map<Class<?>, String> typesByClass = types.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getValue().getRuntimeClass(), Entry::getKey));
        final Map<String, List<String>> parentTypeMappings = buildParentTypeMappings(typesByClass);
        this.cachedDTO = EngineSpecDTO.builder()
                .types(externalizeTypes(engineSpec.getTypes(), parentTypeMappings))
                .actions(externalizeActions(engineSpec.getActions(), typesByClass))
                .functions(externalizeFunctions(engineSpec.getFunctions(), typesByClass))
                .build();
    }

    public ExtendedProcessConfig internal(final ProcessConfigDTO external) {
        final ExtendedProcessConfig internal = new ExtendedProcessConfig();
        internal.setId(external.getId());
        internal.setActions(actionListInternal(external.getActions()));
        return internal;
    }

    public ProcessConfigDTO external(final ExtendedProcessConfig internal) {
        return ProcessConfigDTO.builder()
                .id(internal.getId())
                .actions(actionListExternal(internal.getActions()))
                .build();
    }

    public EngineSpecDTO externalizeSpec() {
        return cachedDTO;
    }

    private ActionListConfig actionListInternal(final ActionListConfigDTO external) {
        return DefaultActionListConfig.builder()
                .actions(
                        external.getActions().stream()
                                .map(this::actionInternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private ActionConfig actionInternal(final ActionConfigDTO external) {
        return DefaultActionConfig.builder()
                .name(external.getName())
                .arguments(
                        external.getArguments()
                                .entrySet()
                                .stream()
                                .map(e -> new Pair<>(e.getKey(), argumentInternal(e.getValue())))
                                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight))
                )
                .build();
    }

    private ArgumentConfig argumentInternal(final ArgumentConfigDTO external) {
        if (external instanceof ActionListConfigDTO actionListConfig) {
            return actionListInternal(actionListConfig);
        } else if (external instanceof InputListConfigDTO inputListConfig) {
            return inputListInternal(inputListConfig);
        } else {
            throw new RuntimeException("Unknown ArgumentConfigDTO type: " + external.getClass());
        }
    }

    private InputListConfig inputListInternal(final InputListConfigDTO external) {
        return DefaultInputListConfig.builder()
                .inputs(
                        external.getInputs().stream()
                                .map(this::inputInternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private InputConfig inputInternal(final InputConfigDTO external) {
        if (external instanceof FunctionConfigDTO functionConfig) {
            return functionInternal(functionConfig);
        } else if (external instanceof ValueConfigDTO valueConfig) {
            return valueInternal(valueConfig);
        } else {
            throw new RuntimeException("Unknown InputConfigDTO type: " + external.getClass());
        }
    }

    private FunctionConfig functionInternal(final FunctionConfigDTO external) {
        return DefaultFunctionConfig.builder()
                .name(external.getName())
                .arguments(
                        external.getArguments().entrySet().stream()
                                .map(e -> new Pair<>(e.getKey(), inputListInternal(e.getValue())))
                                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight))
                )
                .build();
    }

    private ValueConfig valueInternal(final ValueConfigDTO external) {

        final TypeSpec matchingType = engineSpec.getTypes().entrySet().stream()
                .filter(e -> e.getKey().equals(external.getType()))
                .findFirst()
                .map(Entry::getValue)
                .orElseThrow();
        return DefaultValueConfig.builder()
                .value(external.getValue())
                .type(matchingType.getRuntimeClass())
                .build();
    }

    private ActionListConfigDTO actionListExternal(final ActionListConfig internal) {
        return ActionListConfigDTO.builder()
                .actions(
                        internal.getActions().stream()
                                .map(this::actionExternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private ActionConfigDTO actionExternal(final ActionConfig internal) {
        return ActionConfigDTO.builder()
                .name(internal.getName())
                .arguments(
                        internal.getArguments()
                                .entrySet()
                                .stream()
                                .map(e -> new Pair<>(e.getKey(), argumentExternal(e.getValue())))
                                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight))
                )
                .build();
    }

    private ArgumentConfigDTO argumentExternal(final ArgumentConfig internal) {
        if (internal instanceof ActionListConfig actionListConfig) {
            return actionListExternal(actionListConfig);
        } else if (internal instanceof InputListConfig inputListConfig) {
            return inputListExternal(inputListConfig);
        } else {
            throw new RuntimeException("Unknown ArgumentConfig type: " + internal.getClass());
        }
    }

    private InputListConfigDTO inputListExternal(final InputListConfig internal) {
        return InputListConfigDTO.builder()
                .inputs(
                        internal.getInputs().stream()
                                .map(this::inputExternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private InputConfigDTO inputExternal(final InputConfig internal) {
        if (internal instanceof FunctionConfig functionConfig) {
            return functionExternal(functionConfig);
        } else if (internal instanceof ValueConfig valueConfig) {
            return valueExternal(valueConfig);
        } else {
            throw new RuntimeException("Unknown InputConfig type: " + internal.getClass());
        }
    }

    private FunctionConfigDTO functionExternal(final FunctionConfig internal) {
        return FunctionConfigDTO.builder()
                .name(internal.getName())
                .arguments(
                        internal.getArguments().entrySet().stream()
                                .map(e -> new Pair<>(e.getKey(), inputListExternal(e.getValue())))
                                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight))
                )
                .build();
    }

    private ValueConfigDTO valueExternal(final ValueConfig internal) {

        final String matchingType = engineSpec.getTypes().entrySet().stream()
                .filter(e -> e.getValue().getRuntimeClass().equals(internal.getType()))
                .findFirst()
                .map(Entry::getKey)
                .orElseThrow();
        return ValueConfigDTO.builder()
                .value(internal.getValue())
                .type(matchingType)
                .build();
    }


    private Map<String, List<String>> buildParentTypeMappings(final Map<Class<?>, String> typesByClass) {
        final Map<String, List<String>> parentMapping = new HashMap<>();

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

                final List<String> supertypes = parentMapping.computeIfAbsent(subtypeId, (k) -> new ArrayList<>());

                if (supertypeClass.isAssignableFrom(subtypeClass)) {
                    supertypes.add(supertypeId);
                }
            }
        }

        // Find conversion relationships. To simplify the frontend, we will consider types to which there exists a
        //  conversion to be "supertypes", meaning the "input" type can be used in its place
        for (final ConverterSpec converter : engineSpec.getConverters()) {
            final Class<?> inputType = converter.getInputType();
            final Class<?> outputType = converter.getOutputType();

            if (typesByClass.containsKey(inputType) && typesByClass.containsKey(outputType)) {
                // We would expect this to always be true, since there's no point in a converter existing otherwise
                //  consider error/warning
                final String subtypeId = typesByClass.get(inputType);
                final String supertypeId = typesByClass.get(outputType);
                final List<String> supertypes = parentMapping.computeIfAbsent(subtypeId, (k) -> new ArrayList<>());
                supertypes.add(supertypeId);
            }
        }


        return parentMapping;
    }

    private Map<String, TypeSpecDTO> externalizeTypes(final Map<String, TypeSpec> internal,
                                                      final Map<String, List<String>> parentTypeMappings) {

        return internal.entrySet().stream()
                .map(e -> this.externalizeType(e, parentTypeMappings.get(e.getKey())))
                .collect(Collectors.toMap(TypeSpecDTO::getId, Function.identity()));
    }

    private TypeSpecDTO externalizeType(final Entry<String, TypeSpec> internal, final List<String> parentTypeIds) {
        return TypeSpecDTO.builder()
                .id(internal.getKey())
                .values(internal.getValue().getValues())
                .parentIds(parentTypeIds)
                .build();
    }

    private Map<String, ActionSpecDTO> externalizeActions(final Map<String, ActionSpec> internal,
                                                          final Map<Class<?>, String> typesByClass) {

        return internal.values().stream()
                .map(actionSpec -> externalizeAction(actionSpec, typesByClass))
                .collect(Collectors.toMap(ActionSpecDTO::getName, Function.identity()));
    }

    private ActionSpecDTO externalizeAction(final ActionSpec internal, final Map<Class<?>, String> typesByClass) {
        return ActionSpecDTO.builder()
                .name(internal.getName())
                .parameters(this.externalizeActionParameters(internal.getParameters(), typesByClass))
                .build();
    }

    private Map<String, ParameterSpecDTO> externalizeActionParameters(final List<ParameterSpec> internal,
                                                                      final Map<Class<?>, String> typesByClass) {

        final Map<String, ParameterSpecDTO> out = new HashMap<>();
        internal.forEach(parameterSpec -> {
            final String name = parameterSpec.getName();
            final Class<?> type = parameterSpec.getType();
            if (parameterSpec instanceof ComputedParameterSpec computedParameterSpec) {
                out.put(name, ComputedParameterSpecDTO.builder()
                        .returnType(typesByClass.get(computedParameterSpec.getType()))
                        .multi(computedParameterSpec.isMulti())
                        .build());
            } else if (type.equals(ChildActions.class) && parameterSpec instanceof InjectedParameterSpec) {
                out.put(name, ActionListSpecDTO.builder().build());
            }
        });
        return out;
    }

    private Map<String, FunctionSpecDTO> externalizeFunctions(final Map<String, FunctionSpec> internal,
                                                              final Map<Class<?>, String> typesByClass) {

        return internal.values().stream()
                .map(functionSpec -> externalizeFunction(functionSpec, typesByClass))
                .collect(Collectors.toMap(FunctionSpecDTO::getName, Function.identity()));
    }

    private FunctionSpecDTO externalizeFunction(final FunctionSpec internal, final Map<Class<?>, String> typesByClass) {
        return FunctionSpecDTO.builder()
                .name(internal.getName())
                .returnType(typesByClass.get(internal.getOutputType()))
                .parameters(this.externalizeFunctionParameters(internal.getParameters(), typesByClass))
                .build();
    }

    private Map<String, ComputedParameterSpecDTO> externalizeFunctionParameters(final List<ParameterSpec> internal,
                                                                                final Map<Class<?>, String> typesByClass) {

        final Map<String, ComputedParameterSpecDTO> out = new HashMap<>();
        internal.forEach(parameterSpec -> {
            final String name = parameterSpec.getName();
            if (parameterSpec instanceof ComputedParameterSpec computedParameterSpec) {
                out.put(name, ComputedParameterSpecDTO.builder()
                        .returnType(typesByClass.get(computedParameterSpec.getType()))
                        .multi(computedParameterSpec.isMulti())
                        .build());
            }
        });
        return out;
    }

}
