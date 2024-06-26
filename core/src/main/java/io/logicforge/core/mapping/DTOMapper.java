package io.logicforge.core.mapping;

import io.logicforge.core.common.Coordinates;
import io.logicforge.core.common.Pair;
import io.logicforge.core.constant.ControlStatementType;
import io.logicforge.core.model.domain.config.ActionConfig;
import io.logicforge.core.model.domain.config.BlockConfig;
import io.logicforge.core.model.domain.config.ConditionalConfig;
import io.logicforge.core.model.domain.config.ControlStatementConfig;
import io.logicforge.core.model.domain.config.ExecutableConfig;
import io.logicforge.core.model.domain.config.ExpressionConfig;
import io.logicforge.core.model.domain.config.FunctionConfig;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.domain.config.ReferenceConfig;
import io.logicforge.core.model.domain.config.ValueConfig;
import io.logicforge.core.model.domain.specification.CallableSpec;
import io.logicforge.core.model.domain.specification.EngineSpec;
import io.logicforge.core.model.domain.specification.InputSpec;
import io.logicforge.core.model.domain.specification.ProvidedCallableSpec;
import io.logicforge.core.model.domain.specification.TypePropertySpec;
import io.logicforge.core.model.domain.specification.TypeSpec;
import io.logicforge.core.model.dto.config.ActionConfigDTO;
import io.logicforge.core.model.dto.config.BlockConfigDTO;
import io.logicforge.core.model.dto.config.ConditionalConfigDTO;
import io.logicforge.core.model.dto.config.ControlStatementConfigDTO;
import io.logicforge.core.model.dto.config.ExecutableConfigDTO;
import io.logicforge.core.model.dto.config.ExpressionConfigDTO;
import io.logicforge.core.model.dto.config.FunctionConfigDTO;
import io.logicforge.core.model.dto.config.ProcessConfigDTO;
import io.logicforge.core.model.dto.config.ReferenceConfigDTO;
import io.logicforge.core.model.dto.config.ValueConfigDTO;
import io.logicforge.core.model.dto.specification.CallableSpecDTO;
import io.logicforge.core.model.dto.specification.EngineSpecDTO;
import io.logicforge.core.model.dto.specification.ExpressionSpecDTO;
import io.logicforge.core.model.dto.specification.InputSpecDTO;
import io.logicforge.core.model.dto.specification.ProvidedCallableSpecDTO;
import io.logicforge.core.model.dto.specification.TypePropertySpecDTO;
import io.logicforge.core.model.dto.specification.TypeSpecDTO;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Function;
import java.util.stream.Collectors;

public abstract class DTOMapper<ID> {

  private final EngineSpec engineSpec;

  public DTOMapper(final EngineSpec engineSpec) {
    this.engineSpec = engineSpec;
  }

  public <T> ProcessConfig<T, ID> internal(final ProcessConfigDTO external,
      final Class<T> functionalInterface) {
    final ID internalId = internalID(external.getExternalId());
    return ProcessConfig.<T, ID>builder()
        .functionalInterface(functionalInterface)
        .id(internalId)
        .name(external.getName())
        .returnExpression(external.getReturnExpression()
            .stream()
            .map(this::expressionInternal)
            .collect(Collectors.toList()))
        .rootBlock(this.blockInternal(external.getRootBlock()))
        .build();
  }

  public ProcessConfigDTO external(final ProcessConfig<?, ID> internal) {
    final Object externalId = externalId(internal.getId());
    return ProcessConfigDTO.builder()
        .externalId(externalId)
        .name(internal.getName())
        .rootBlock(blockExternal(internal.getRootBlock()))
        .returnExpression(internal.getReturnExpression()
            .stream()
            .map(this::expressionExternal)
            .collect(Collectors.toList()))
        .build();
  }

  public EngineSpecDTO externalSpec() {
    return EngineSpecDTO.builder()
        .processes(callableSpecsExternal(engineSpec.getProcesses()))
        .types(typeSpecsExternal(engineSpec.getTypes()))
        .actions(providedCallableSpecsExternal(engineSpec.getActions()))
        .functions(providedCallableSpecsExternal(engineSpec.getFunctions()))
        .controls(engineSpec.getControls())
        .build();
  }

  protected abstract Object externalId(final ID internalId);

  protected abstract ID internalID(final Object externalId);

  protected ExecutableConfig executableInternal(final ExecutableConfigDTO external) {
    if (external instanceof ActionConfigDTO actionConfig) {
      return actionInternal(actionConfig);
    } else if (external instanceof ControlStatementConfigDTO controlStatementConfig) {
      return controlStatementInternal(controlStatementConfig);
    }
    throw new RuntimeException("Unknown ExecutableConfigDTO type: " + external.getClass());
  }

  protected BlockConfig blockInternal(final BlockConfigDTO external) {
    return BlockConfig.builder()
        .executables(external.getExecutables()
            .stream()
            .map(this::executableInternal)
            .collect(Collectors.toList()))
        .build();
  }

  protected ActionConfig actionInternal(final ActionConfigDTO external) {
    return ActionConfig.builder()
        .name(external.getName())
        .arguments(external.getArguments()
            .entrySet()
            .stream()
            .map(e -> new Pair<>(e.getKey(), e.getValue()
                .stream()
                .map(this::expressionInternal)
                .collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  protected ControlStatementConfig controlStatementInternal(
      final ControlStatementConfigDTO external) {
    if (external instanceof ConditionalConfigDTO conditionalConfig) {
      return ConditionalConfig.builder()
          .type(ControlStatementType.CONDITIONAL)
          .blocks(external.getBlocks()
              .stream()
              .map(this::blockInternal)
              .collect(Collectors.toList()))
          .condition(expressionInternal(conditionalConfig.getCondition()))
          .build();
    }
    throw new RuntimeException("Unknown ControlStatementConfigDTO type: " + external.getClass());
  }

  protected ExpressionConfig expressionInternal(final ExpressionConfigDTO external) {
    if (external instanceof FunctionConfigDTO functionConfig) {
      return functionInternal(functionConfig);
    } else if (external instanceof ValueConfigDTO valueConfig) {
      return valueInternal(valueConfig);
    } else if (external instanceof ReferenceConfigDTO referenceConfig) {
      return referenceInternal(referenceConfig);
    }
    throw new RuntimeException("Unknown ExpressionConfigDTO type: " + external.getClass());
  }

  protected FunctionConfig functionInternal(final FunctionConfigDTO external) {
    return FunctionConfig.builder()
        .name(external.getName())
        .arguments(external.getArguments()
            .entrySet()
            .stream()
            .map(e -> new Pair<>(e.getKey(), e.getValue()
                .stream()
                .map(this::expressionInternal)
                .collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  protected ValueConfig valueInternal(final ValueConfigDTO external) {

    final String matchingType = engineSpec.getTypes()
        .keySet()
        .stream()
        .filter(key -> key.equals(external.getTypeId()))
        .findFirst()
        .orElseThrow();
    return ValueConfig.builder().value(external.getValue()).typeId(matchingType).build();
  }

  protected ReferenceConfig referenceInternal(final ReferenceConfigDTO external) {
    return ReferenceConfig.builder()
        .coordinates(Coordinates.from(external.getCoordinates()))
        .path(Arrays.stream(external.getPath()).collect(Collectors.toList()))
        .build();
  }

  protected ExecutableConfigDTO executableExternal(final ExecutableConfig internal) {
    if (internal instanceof ActionConfig actionConfig) {
      return actionExternal(actionConfig);
    } else if (internal instanceof ControlStatementConfig controlStatementConfig) {
      return controlStatementExternal(controlStatementConfig);
    }
    throw new RuntimeException("Unknown ExecutableConfig type: " + internal.getClass());
  }

  protected BlockConfigDTO blockExternal(final BlockConfig internal) {
    final BlockConfigDTO out = new BlockConfigDTO();
    out.setExecutables(internal.getExecutables()
        .stream()
        .map(this::executableExternal)
        .collect(Collectors.toList()));
    return out;
  }

  protected ActionConfigDTO actionExternal(final ActionConfig internal) {
    final ActionConfigDTO out = new ActionConfigDTO();
    out.setName(internal.getName());
    out.setArguments(internal.getArguments()
        .entrySet()
        .stream()
        .map(e -> new Pair<>(e.getKey(), e.getValue()
            .stream()
            .map(this::expressionExternal)
            .collect(Collectors.toList())))
        .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)));
    return out;
  }

  protected ControlStatementConfigDTO controlStatementExternal(
      final ControlStatementConfig internal) {
    if (internal instanceof ConditionalConfig conditionalConfig) {
      final ConditionalConfigDTO out = new ConditionalConfigDTO();
      out.setControlType(ControlStatementType.CONDITIONAL);
      out.setBlocks(internal.getBlocks()
          .stream()
          .map(this::blockExternal)
          .collect(Collectors.toList()));
      out.setCondition(expressionExternal(conditionalConfig.getCondition()));
      return out;
    }
    throw new RuntimeException("Unknown ControlStatementConfig type: " + internal.getClass());
  }

  protected ExpressionConfigDTO expressionExternal(final ExpressionConfig internal) {
    if (internal instanceof FunctionConfig functionConfig) {
      return functionExternal(functionConfig);
    } else if (internal instanceof ValueConfig valueConfig) {
      return valueExternal(valueConfig);
    } else if (internal instanceof ReferenceConfig referenceConfig) {
      return referenceExternal(referenceConfig);
    }
    throw new RuntimeException("Unknown ExpressionConfig type: " + internal.getClass());
  }

  protected FunctionConfigDTO functionExternal(final FunctionConfig internal) {
    final FunctionConfigDTO out = new FunctionConfigDTO();
    out.setName(internal.getName());
    out.setArguments(internal.getArguments()
        .entrySet()
        .stream()
        .map(e -> new Pair<>(e.getKey(), e.getValue()
            .stream()
            .map(this::expressionExternal)
            .collect(Collectors.toList())))
        .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)));
    return out;
  }

  protected ValueConfigDTO valueExternal(final ValueConfig internal) {
    final String matchingType = engineSpec.getTypes()
        .keySet()
        .stream()
        .filter(id -> id.equals(internal.getTypeId()))
        .findFirst()
        .orElseThrow();
    final ValueConfigDTO out = new ValueConfigDTO();
    out.setValue(internal.getValue());
    out.setTypeId(matchingType);
    return out;
  }

  protected ReferenceConfigDTO referenceExternal(final ReferenceConfig internal) {
    final ReferenceConfigDTO out = new ReferenceConfigDTO();
    out.setPath(internal.getPath().toArray(new String[0]));
    out.setCoordinates(internal.getCoordinates().asArray());
    return out;
  }

  protected Map<String, CallableSpecDTO> callableSpecsExternal(
      final Map<String, ? extends CallableSpec> internal) {
    return internal.values()
        .stream()
        .map(this::callableSpecExternal)
        .collect(Collectors.toMap(CallableSpecDTO::getName, Function.identity()));
  }

  protected CallableSpecDTO callableSpecExternal(final CallableSpec internal) {
    return CallableSpecDTO.builder()
        .name(internal.getName())
        .inputs(inputSpecsExternal(internal.getInputs()))
        .output(ExpressionSpecDTO.builder()
            .type(expressionSpecExternal(internal.getType()))
            .multi(internal.isMulti())
            .build())
        .build();
  }

  protected Map<String, ProvidedCallableSpecDTO> providedCallableSpecsExternal(
      final Map<String, ? extends ProvidedCallableSpec> internal) {
    return internal.values()
        .stream()
        .map(this::providedCallableSpecExternal)
        .collect(Collectors.toMap(ProvidedCallableSpecDTO::getName, Function.identity()));
  }

  protected ProvidedCallableSpecDTO providedCallableSpecExternal(
      final ProvidedCallableSpec internal) {
    return ProvidedCallableSpecDTO.builder()
        .name(internal.getName())
        .inputs(inputSpecsExternal(internal.getInputs()))
        .output(ExpressionSpecDTO.builder()
            .type(expressionSpecExternal(internal.getType()))
            .multi(internal.isMulti())
            .build())
        .metadata(internal.getMetadata())
        .build();
  }

  protected Map<String, TypeSpecDTO> typeSpecsExternal(final Map<String, TypeSpec> internal) {

    return internal.entrySet()
        .stream()
        .map(this::typeSpecExternal)
        .collect(Collectors.toMap(TypeSpecDTO::getId, Function.identity()));
  }

  protected TypeSpecDTO typeSpecExternal(final Entry<String, TypeSpec> internal) {
    return TypeSpecDTO.builder()
        .id(internal.getKey())
        .values(internal.getValue().getValues())
        .valueType(internal.getValue().isValueType())
        .supertypes(new ArrayList<>(internal.getValue().getSupertypes()))
        .properties(internal.getValue()
            .getProperties()
            .entrySet()
            .stream()
            .map(e -> new Pair<>(e.getKey(), typePropertySpecExternal(e.getValue())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  protected TypePropertySpecDTO typePropertySpecExternal(final TypePropertySpec internal) {
    return TypePropertySpecDTO.builder()
        .type(new String[] {internal.getTypeId()})
        .multi(internal.isMulti())
        .optional(internal.isOptional())
        .build();
  }

  protected String[] expressionSpecExternal(final Class<?> type) {
    if (void.class.equals(type)) {
      return new String[0];
    }
    return new String[] {engineSpec.getTypes()
        .entrySet()
        .stream()
        .filter(e -> e.getValue().getRuntimeClass().equals(type))
        .findFirst()
        .map(Entry::getKey)
        .orElseThrow(() -> new RuntimeException("No registered type matches runtime class %s"
            .formatted(type)))};
  }

  protected Map<String, InputSpecDTO> inputSpecsExternal(final List<InputSpec> internal) {

    return internal.stream()
        .map(inputSpec -> new Pair<>(inputSpec.getName(), inputSpec))
        .collect(Collectors.toMap(Pair::getLeft, pair -> inputSpecExternal(pair.getRight())));
  }

  protected InputSpecDTO inputSpecExternal(final InputSpec internal) {
    final String[] type = expressionSpecExternal(internal.getType());
    return InputSpecDTO.builder()
        .type(type)
        .multi(internal.isMulti())
        .metadata(internal.getMetadata())
        .build();
  }

}
