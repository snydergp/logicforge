package io.logicforge.console.mapping;

import io.logicforge.console.model.domain.ExtendedProcessConfig;
import io.logicforge.console.model.persistence.ActionConfigDocument;
import io.logicforge.console.model.persistence.ActionListConfigDocument;
import io.logicforge.console.model.persistence.ArgumentConfigDocument;
import io.logicforge.console.model.persistence.FunctionConfigDocument;
import io.logicforge.console.model.persistence.InputConfigDocument;
import io.logicforge.console.model.persistence.InputListConfigDocument;
import io.logicforge.console.model.persistence.ProcessConfigDocument;
import io.logicforge.console.model.persistence.ValueConfigDocument;
import io.logicforge.core.common.Pair;
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
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.TypeSpec;
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
        return ProcessConfigDocument.builder()
                .id(external.getId())
                .actions(
                        actionListInternal(external.getActions())
                )
                .build();
    }

    private ActionListConfigDocument actionListInternal(final ActionListConfig external) {
        return ActionListConfigDocument.builder()
                .actions(
                        external.getActions().stream()
                                .map(this::actionInternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private ActionConfigDocument actionInternal(final ActionConfig external) {
        return ActionConfigDocument.builder()
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

    private ArgumentConfigDocument argumentInternal(final ArgumentConfig external) {
        if (external instanceof ActionListConfig actionListConfig) {
            return actionListInternal(actionListConfig);
        } else if (external instanceof InputListConfig inputListConfig) {
            return inputListInternal(inputListConfig);
        } else {
            throw new RuntimeException("Unknown ArgumentConfig type: " + external.getClass());
        }
    }

    private InputListConfigDocument inputListInternal(final InputListConfig external) {
        return InputListConfigDocument.builder()
                .inputs(
                        external.getInputs().stream()
                                .map(this::inputInternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private InputConfigDocument inputInternal(final InputConfig external) {
        if (external instanceof FunctionConfig functionConfig) {
            return functionInternal(functionConfig);
        } else if (external instanceof ValueConfig valueConfig) {
            return valueInternal(valueConfig);
        } else {
            throw new RuntimeException("Unknown InputConfig type: " + external.getClass());
        }
    }

    private FunctionConfigDocument functionInternal(final FunctionConfig external) {
        return FunctionConfigDocument.builder()
                .name(external.getName())
                .arguments(
                        external.getArguments().entrySet().stream()
                                .map(e -> new Pair<>(e.getKey(), inputListInternal(e.getValue())))
                                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight))
                )
                .build();
    }

    private ValueConfigDocument valueInternal(final ValueConfig external) {
        final String matchingType = engineSpec.getTypes().entrySet().stream()
                .filter(e -> e.getValue().getRuntimeClass().equals(external.getType()))
                .findFirst()
                .map(Entry::getKey)
                .orElseThrow();
        return ValueConfigDocument.builder()
                .value(external.getValue())
                .type(matchingType)
                .build();
    }

    public ExtendedProcessConfig external(final ProcessConfigDocument internal) {
        final ExtendedProcessConfig external = new ExtendedProcessConfig();
        external.setId(internal.getId());
        external.setActions(
                this.actionListExternal(internal.getActions())
        );
        return external;
    }

    private ActionListConfig actionListExternal(final ActionListConfigDocument internal) {
        return DefaultActionListConfig.builder()
                .actions(
                        internal.getActions().stream()
                                .map(this::actionExternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private ActionConfig actionExternal(final ActionConfigDocument internal) {
        return DefaultActionConfig.builder()
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

    private ArgumentConfig argumentExternal(final ArgumentConfigDocument internal) {
        if (internal instanceof ActionListConfigDocument actionListConfig) {
            return actionListExternal(actionListConfig);
        } else if (internal instanceof InputListConfigDocument inputListConfig) {
            return inputListExternal(inputListConfig);
        } else {
            throw new RuntimeException("Unknown ArgumentConfig type: " + internal.getClass());
        }
    }

    private InputListConfig inputListExternal(final InputListConfigDocument internal) {
        return DefaultInputListConfig.builder()
                .inputs(
                        internal.getInputs().stream()
                                .map(this::inputExternal)
                                .collect(Collectors.toList())
                )
                .build();
    }

    private InputConfig inputExternal(final InputConfigDocument internal) {
        if (internal instanceof FunctionConfigDocument functionConfig) {
            return functionExternal(functionConfig);
        } else if (internal instanceof ValueConfigDocument valueConfig) {
            return valueExternal(valueConfig);
        } else {
            throw new RuntimeException("Unknown InputConfigDocument type: " + internal.getClass());
        }
    }

    private FunctionConfig functionExternal(final FunctionConfigDocument internal) {
        return DefaultFunctionConfig.builder()
                .name(internal.getName())
                .arguments(
                        internal.getArguments().entrySet().stream()
                                .map(e -> new Pair<>(e.getKey(), inputListExternal(e.getValue())))
                                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight))
                )
                .build();
    }

    private ValueConfig valueExternal(final ValueConfigDocument internal) {
        final TypeSpec matchingType = engineSpec.getTypes().entrySet().stream()
                .filter(e -> e.getKey().equals(internal.getType()))
                .findFirst()
                .map(Entry::getValue)
                .orElseThrow();
        return DefaultValueConfig.builder()
                    .value(internal.getValue())
                    .type(matchingType.getRuntimeClass())
                    .build();
    }


}
