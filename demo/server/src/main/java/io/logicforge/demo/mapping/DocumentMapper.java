package io.logicforge.demo.mapping;

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
import io.logicforge.core.model.domain.config.ValueConfig;
import io.logicforge.core.model.domain.config.VariableConfig;
import io.logicforge.core.model.domain.specification.EngineSpec;
import io.logicforge.demo.model.domain.WebServerProcess;
import io.logicforge.demo.model.persistence.ActionConfigDocument;
import io.logicforge.demo.model.persistence.BlockConfigDocument;
import io.logicforge.demo.model.persistence.ConditionalConfigDocument;
import io.logicforge.demo.model.persistence.ControlStatementConfigDocument;
import io.logicforge.demo.model.persistence.ExecutableConfigDocument;
import io.logicforge.demo.model.persistence.ExpressionConfigDocument;
import io.logicforge.demo.model.persistence.FunctionConfigDocument;
import io.logicforge.demo.model.persistence.ProcessConfigDocument;
import io.logicforge.demo.model.persistence.ValueConfigDocument;
import io.logicforge.demo.model.persistence.VariableConfigDocument;
import java.util.Map.Entry;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DocumentMapper {

  private final EngineSpec engineSpec;

  @Autowired
  public DocumentMapper(final EngineSpec engineSpec) {
    this.engineSpec = engineSpec;
  }

  public ProcessConfigDocument internal(final ProcessConfig<WebServerProcess, UUID> external) {
    return ProcessConfigDocument.builder()
        .id(external.getId())
        .rootBlock(this.blockInternal(external.getRootBlock()))
        .build();
  }

  private BlockConfigDocument blockInternal(final BlockConfig external) {
    return BlockConfigDocument.builder()
        .executables(external.getExecutables()
            .stream()
            .map(this::executableInternal)
            .collect(Collectors.toList()))
        .build();
  }

  private ExecutableConfigDocument executableInternal(final ExecutableConfig external) {
    if (external instanceof ActionConfig actionConfig) {
      return actionInternal(actionConfig);
    } else if (external instanceof BlockConfig blockConfig) {
      return blockInternal(blockConfig);
    } else if (external instanceof ControlStatementConfig controlStatementConfig) {
      return controlStatementInternal(controlStatementConfig);
    }
    throw new IllegalArgumentException("Unknown executable interface: %s".formatted(external
        .getClass()));
  }

  private ActionConfigDocument actionInternal(final ActionConfig external) {
    return ActionConfigDocument.builder()
        .name(external.getName())
        .inputs(external.getArguments()
            .entrySet()
            .stream()
            .map(e -> new Pair<>(e.getKey(), e.getValue()
                .stream()
                .map(this::expressionInternal)
                .collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .output(external.getOutput() != null ? variableInternal(external.getOutput()) : null)
        .build();
  }

  private ControlStatementConfigDocument controlStatementInternal(
      final ControlStatementConfig external) {
    if (external instanceof ConditionalConfig conditionalConfig) {
      return ConditionalConfigDocument.builder()
          .blocks(external.getBlocks()
              .stream()
              .map(this::blockInternal)
              .collect(Collectors.toList()))
          .condition(expressionInternal(conditionalConfig.getCondition()))
          .build();
    }
    throw new RuntimeException("Unknown ControlStatementConfig type: " + external.getClass());
  }

  private ExpressionConfigDocument expressionInternal(final ExpressionConfig external) {
    if (external instanceof FunctionConfig functionConfig) {
      return functionInternal(functionConfig);
    } else if (external instanceof ValueConfig valueConfig) {
      return valueInternal(valueConfig);
    } else {
      throw new RuntimeException("Unknown ExpressionConfig type: " + external.getClass());
    }
  }

  private FunctionConfigDocument functionInternal(final FunctionConfig external) {
    return FunctionConfigDocument.builder()
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

  private ValueConfigDocument valueInternal(final ValueConfig external) {
    final String matchingType = engineSpec.getTypes()
        .entrySet()
        .stream()
        .filter(e -> e.getKey().equals(external.getTypeId()))
        .findFirst()
        .map(Entry::getKey)
        .orElseThrow();
    return ValueConfigDocument.builder().value(external.getValue()).type(matchingType).build();
  }

  private VariableConfigDocument variableInternal(final VariableConfig external) {
    return VariableConfigDocument.builder()
        .title(external.getTitle())
        .description(external.getDescription())
        .build();
  }

  public ProcessConfig<WebServerProcess, UUID> external(final ProcessConfigDocument internal) {
    return ProcessConfig.<WebServerProcess, UUID>builder()
        .functionalInterface(WebServerProcess.class)
        .id(internal.getId())
        .returnStatement(expressionExternal(internal.getReturnStatement()))
        .rootBlock(blockExternal(internal.getRootBlock()))
        .build();
  }

  private ExecutableConfig executableExternal(final ExecutableConfigDocument internal) {
    if (internal instanceof ActionConfigDocument actionConfigDocument) {
      return actionExternal(actionConfigDocument);
    } else if (internal instanceof BlockConfigDocument blockConfigDocument) {
      return blockExternal(blockConfigDocument);
    } else if (internal instanceof ControlStatementConfigDocument controlStatementConfigDocument) {
      return controlStatementExternal(controlStatementConfigDocument);
    }
    throw new RuntimeException("Unknown ExecutableConfigDocument type: " + internal.getClass());
  }

  private BlockConfig blockExternal(final BlockConfigDocument internal) {
    return BlockConfig.builder()
        .executables(internal.getExecutables()
            .stream()
            .map(this::executableExternal)
            .collect(Collectors.toList()))
        .build();
  }

  private ActionConfig actionExternal(final ActionConfigDocument internal) {
    return ActionConfig.builder()
        .name(internal.getName())
        .arguments(internal.getInputs()
            .entrySet()
            .stream()
            .map(e -> new Pair<>(e.getKey(), e.getValue()
                .stream()
                .map(this::expressionExternal)
                .collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ControlStatementConfig controlStatementExternal(
      final ControlStatementConfigDocument internal) {
    if (internal instanceof ConditionalConfigDocument conditionalConfigDocument) {
      return ConditionalConfig.builder()
          .type(ControlStatementType.CONDITIONAL)
          .blocks(internal.getBlocks()
              .stream()
              .map(this::blockExternal)
              .collect(Collectors.toList()))
          .condition(expressionExternal(conditionalConfigDocument.getCondition()))
          .build();
    }
    throw new RuntimeException("Unknown ControlStatementConfig type: " + internal.getClass());
  }


  private ExpressionConfig expressionExternal(final ExpressionConfigDocument internal) {
    if (internal instanceof FunctionConfigDocument functionConfig) {
      return functionExternal(functionConfig);
    } else if (internal instanceof ValueConfigDocument valueConfig) {
      return valueExternal(valueConfig);
    }
    throw new RuntimeException("Unknown ExpressionConfigDocument type: " + internal.getClass());
  }

  private FunctionConfig functionExternal(final FunctionConfigDocument internal) {
    return FunctionConfig.builder()
        .name(internal.getName())
        .arguments(internal.getArguments()
            .entrySet()
            .stream()
            .map(e -> new Pair<>(e.getKey(), e.getValue()
                .stream()
                .map(this::expressionExternal)
                .collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ValueConfig valueExternal(final ValueConfigDocument internal) {
    final String matchingType = engineSpec.getTypes()
        .keySet()
        .stream()
        .filter(key -> key.equals(internal.getType()))
        .findFirst()
        .orElseThrow();
    return ValueConfig.builder().value(internal.getValue()).typeId(matchingType).build();
  }


}
