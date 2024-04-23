package io.logicforge.console.mapping;

import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.console.model.persistence.ActionConfigDocument;
import io.logicforge.console.model.persistence.FunctionConfigDocument;
import io.logicforge.console.model.persistence.InputConfigDocument;
import io.logicforge.console.model.persistence.ProcessConfigDocument;
import io.logicforge.console.model.persistence.ValueConfigDocument;
import io.logicforge.core.common.Pair;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.ExpressionConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.configuration.impl.DefaultActionConfig;
import io.logicforge.core.model.configuration.impl.DefaultFunctionConfig;
import io.logicforge.core.model.configuration.impl.DefaultValueConfig;
import io.logicforge.core.model.specification.EngineSpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map.Entry;
import java.util.stream.Collectors;

@Component
public class DocumentMapper {

  private final EngineSpec engineSpec;

  @Autowired
  public DocumentMapper(final EngineSpec engineSpec) {
    this.engineSpec = engineSpec;
  }

  public ProcessConfigDocument internal(final ExtendedProcessConfig external) {
    return ProcessConfigDocument.builder().id(external.getId()).actions(
        external.getExecutables().stream().map(this::actionInternal).collect(Collectors.toList()))
        .build();
  }

  private ActionConfigDocument actionInternal(final ActionConfig external) {
    return ActionConfigDocument.builder().name(external.getName())
        .actions(external.getActions().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::actionInternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .inputs(external.getArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputInternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private InputConfigDocument inputInternal(final ExpressionConfig external) {
    if (external instanceof FunctionConfig functionConfig) {
      return functionInternal(functionConfig);
    } else if (external instanceof ValueConfig valueConfig) {
      return valueInternal(valueConfig);
    } else {
      throw new RuntimeException("Unknown InputConfig type: " + external.getClass());
    }
  }

  private FunctionConfigDocument functionInternal(final FunctionConfig external) {
    return FunctionConfigDocument.builder().name(external.getName())
        .arguments(external.getArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputInternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ValueConfigDocument valueInternal(final ValueConfig external) {
    final String matchingType = engineSpec.getTypes().entrySet().stream()
        .filter(e -> e.getKey().equals(external.getTypeId())).findFirst().map(Entry::getKey)
        .orElseThrow();
    return ValueConfigDocument.builder().value(external.getValue()).type(matchingType).build();
  }

  public ExtendedProcessConfig external(final ProcessConfigDocument internal) {
    final ExtendedProcessConfig external = new ExtendedProcessConfig();
    external.setId(internal.getId());
    external.setActions(
        internal.getActions().stream().map(this::actionExternal).collect(Collectors.toList()));
    return external;
  }

  private ActionConfig actionExternal(final ActionConfigDocument internal) {
    return DefaultActionConfig.builder().name(internal.getName())
        .actionArguments(internal.getActions().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::actionExternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .inputArguments(internal.getInputs().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputExternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ExpressionConfig inputExternal(final InputConfigDocument internal) {
    if (internal instanceof FunctionConfigDocument functionConfig) {
      return functionExternal(functionConfig);
    } else if (internal instanceof ValueConfigDocument valueConfig) {
      return valueExternal(valueConfig);
    } else {
      throw new RuntimeException("Unknown InputConfigDocument type: " + internal.getClass());
    }
  }

  private FunctionConfig functionExternal(final FunctionConfigDocument internal) {
    return DefaultFunctionConfig.builder().name(internal.getName())
        .arguments(internal.getArguments().entrySet().stream()
            .map(e -> new Pair<>(e.getKey(),
                e.getValue().stream().map(this::inputExternal).collect(Collectors.toList())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight)))
        .build();
  }

  private ValueConfig valueExternal(final ValueConfigDocument internal) {
    final String matchingType = engineSpec.getTypes().keySet().stream()
        .filter(key -> key.equals(internal.getType())).findFirst().orElseThrow();
    return DefaultValueConfig.builder().value(internal.getValue()).typeId(matchingType).build();
  }


}
