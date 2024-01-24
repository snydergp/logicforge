package io.logicforge.console.mapping;

import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.console.model.dto.config.ActionConfigDTO;
import io.logicforge.console.model.dto.config.FunctionConfigDTO;
import io.logicforge.console.model.dto.config.InputConfigDTO;
import io.logicforge.console.model.dto.config.ProcessConfigDTO;
import io.logicforge.console.model.dto.config.ValueConfigDTO;
import io.logicforge.console.model.dto.spec.ActionListSpecDTO;
import io.logicforge.console.model.dto.spec.ActionSpecDTO;
import io.logicforge.console.model.dto.spec.EngineSpecDTO;
import io.logicforge.console.model.dto.spec.FunctionSpecDTO;
import io.logicforge.console.model.dto.spec.InputParameterSpecDTO;
import io.logicforge.console.model.dto.spec.ProcessSpecDTO;
import io.logicforge.console.model.dto.spec.TypeSpecDTO;
import io.logicforge.core.common.Pair;
import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.configuration.impl.DefaultActionConfig;
import io.logicforge.core.model.configuration.impl.DefaultFunctionConfig;
import io.logicforge.core.model.configuration.impl.DefaultValueConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.ComputedParameterSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.ParameterSpec;
import io.logicforge.core.model.specification.ProcessSpec;
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
    this.cachedDTO =
        EngineSpecDTO.builder().processes(externalizeProcesses(engineSpec.getProcesses()))
            .types(externalizeTypes(engineSpec.getTypes()))
            .actions(externalizeActions(engineSpec.getActions(), typesByClass))
            .functions(externalizeFunctions(engineSpec.getFunctions(), typesByClass)).build();
  }

  public ExtendedProcessConfig internal(final ProcessConfigDTO external) {
    final ExtendedProcessConfig internal = new ExtendedProcessConfig();
    internal.setId(external.getId());
    internal.setActions(
        external.getActions().stream().map(this::actionInternal).collect(Collectors.toList()));
    return internal;
  }

  public ProcessConfigDTO external(final ExtendedProcessConfig internal) {
    return ProcessConfigDTO.builder().id(internal.getId())
        .actions(
            internal.getActions().stream().map(this::actionExternal).collect(Collectors.toList()))
        .build();
  }

  public EngineSpecDTO externalizeSpec() {
    return cachedDTO;
  }

  private ActionConfig actionInternal(final ActionConfigDTO external) {
    return DefaultActionConfig.builder().name(external.getName())
        .actionArguments(external.getActionArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::actionInternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .inputArguments(external.getInputArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputInternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
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
    return DefaultFunctionConfig.builder().name(external.getName())
        .arguments(external.getArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputInternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ValueConfig valueInternal(final ValueConfigDTO external) {

    final String matchingType = engineSpec.getTypes().keySet().stream()
        .filter(key -> key.equals(external.getType())).findFirst().orElseThrow();
    return DefaultValueConfig.builder().value(external.getValue()).typeId(matchingType).build();
  }

  private ActionConfigDTO actionExternal(final ActionConfig internal) {
    return ActionConfigDTO.builder().name(internal.getName())
        .actionArguments(internal.getActionArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::actionExternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .inputArguments(internal.getInputArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputExternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
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
    return FunctionConfigDTO.builder().name(internal.getName())
        .arguments(internal.getArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputExternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ValueConfigDTO valueExternal(final ValueConfig internal) {

    final String matchingType = engineSpec.getTypes().keySet().stream()
        .filter(id -> id.equals(internal.getTypeId())).findFirst().orElseThrow();
    return ValueConfigDTO.builder().value(internal.getValue()).type(matchingType).build();
  }

  private Map<String, ProcessSpecDTO> externalizeProcesses(
      final Map<String, ProcessSpec> internal) {
    return internal.values().stream().map(this::externalizeProcess)
        .collect(Collectors.toMap(ProcessSpecDTO::getName, Function.identity()));
  }

  private ProcessSpecDTO externalizeProcess(final ProcessSpec internal) {
    return ProcessSpecDTO.builder().name(internal.getName()).build();
  }

  private Map<String, TypeSpecDTO> externalizeTypes(final Map<String, TypeSpec> internal) {

    return internal.entrySet().stream().map(this::externalizeType)
        .collect(Collectors.toMap(TypeSpecDTO::getId, Function.identity()));
  }

  private TypeSpecDTO externalizeType(final Entry<String, TypeSpec> internal) {
    return TypeSpecDTO.builder().id(internal.getKey()).values(internal.getValue().getValues())
        .supertypes(new ArrayList<>(internal.getValue().getSupertypes())).build();
  }

  private Map<String, ActionSpecDTO> externalizeActions(final Map<String, ActionSpec> internal,
      final Map<Class<?>, String> typesByClass) {

    return internal.values().stream().map(actionSpec -> externalizeAction(actionSpec, typesByClass))
        .collect(Collectors.toMap(ActionSpecDTO::getName, Function.identity()));
  }

  private ActionSpecDTO externalizeAction(final ActionSpec internal,
      final Map<Class<?>, String> typesByClass) {
    return ActionSpecDTO.builder().name(internal.getName())
        .actionParameters(internal.getParameters().stream()
            .filter(parameterSpec -> parameterSpec.getType().equals(ChildActions.class))
            .map(parameterSpec -> ActionListSpecDTO.builder().name(parameterSpec.getName()).build())
            .collect(Collectors.toMap(ActionListSpecDTO::getName, Function.identity())))
        .inputParameters(internal.getParameters().stream()
            .filter(parameterSpec -> parameterSpec instanceof ComputedParameterSpec)
            .map(parameterSpec -> this
                .externalizeInputParameter((ComputedParameterSpec) parameterSpec, typesByClass))
            .collect(Collectors.toMap(InputParameterSpecDTO::getName, Function.identity())))
        .build();
  }

  private Map<String, FunctionSpecDTO> externalizeFunctions(
      final Map<String, FunctionSpec> internal, final Map<Class<?>, String> typesByClass) {

    return internal.values().stream()
        .map(functionSpec -> externalizeFunction(functionSpec, typesByClass))
        .collect(Collectors.toMap(FunctionSpecDTO::getName, Function.identity()));
  }

  private FunctionSpecDTO externalizeFunction(final FunctionSpec internal,
      final Map<Class<?>, String> typesByClass) {
    return FunctionSpecDTO.builder().name(internal.getName())
        .returnType(typesByClass.get(internal.getOutputType()))
        .parameters(this.externalizeFunctionParameters(internal.getParameters(), typesByClass))
        .build();
  }

  private Map<String, InputParameterSpecDTO> externalizeFunctionParameters(
      final List<ParameterSpec> internal, final Map<Class<?>, String> typesByClass) {

    final Map<String, InputParameterSpecDTO> out = new HashMap<>();
    internal.forEach(parameterSpec -> {
      final String name = parameterSpec.getName();
      if (parameterSpec instanceof ComputedParameterSpec computedParameterSpec) {
        out.put(name,
            InputParameterSpecDTO.builder()
                .returnType(typesByClass.get(computedParameterSpec.getType()))
                .multi(computedParameterSpec.isMulti()).build());
      }
    });
    return out;
  }

  private InputParameterSpecDTO externalizeInputParameter(final ComputedParameterSpec internal,
      final Map<Class<?>, String> typesByClass) {
    return InputParameterSpecDTO.builder().name(internal.getName())
        .returnType(typesByClass.get(internal.getType())).multi(internal.isMulti()).build();
  }

}
