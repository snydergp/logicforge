package io.logicforge.core.validation;

import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.common.Coordinates;
import io.logicforge.core.model.configuration.BlockConfig;
import io.logicforge.core.model.configuration.ControlStatementConfig;
import io.logicforge.core.model.configuration.ExecutableConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.specification.EngineSpec;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Stream;

import static io.logicforge.core.common.Coordinates.ROOT;

/**
 * A service that validates process configurations. This includes the following error scenarios:
 * <ul>
 * <li>Referencing a variable before it is available</li>
 * <li>Referencing a null variable</li>
 * <li>Circular references</li>
 * <li>Input not satisfied by corresponding expression (type incompatibility)</li>
 * <li>Value cannot be converted to the required type</li>
 * <li>Missing required inputs</li>
 * </ul>
 */
@RequiredArgsConstructor
public class ProcessValidator {

  private final EngineSpec engineSpec;

  public List<ValidationError> validate(final ProcessConfig config) {
    return new ProcessConfigValidator(config).validate().toList();
  }

  private interface Validator {
    Stream<ValidationError> validate();
  }

  private class ProcessConfigValidator implements Validator {

    private final ProcessConfig processConfig;
    private final CoordinateTrie<ExecutableConfigValidator> trie = new CoordinateTrie<>();

    private ProcessConfigValidator(ProcessConfig processConfig) {
      this.processConfig = processConfig;
      newExecutableConfigValidator(processConfig.getRootBlock(), ROOT);
    }

    private void newExecutableConfigValidator(final ExecutableConfig config,
        final Coordinates coordinates) {
      final ExecutableConfigValidator validator =
          new ExecutableConfigValidator(this, config, coordinates);
      trie.put(coordinates, validator);

      if (config instanceof BlockConfig blockConfig) {
        for (int i = 0; i < blockConfig.getExecutables().size(); i++) {
          final ExecutableConfig child = blockConfig.getExecutables().get(i);
          final Coordinates childCoordinates = coordinates.getNthChild(i);
          newExecutableConfigValidator(child, childCoordinates);
        }
      } else if (config instanceof ControlStatementConfig controlStatementConfig) {
        for (int i = 0; i < controlStatementConfig.getBlocks().size(); i++) {
          final BlockConfig child = controlStatementConfig.getBlocks().get(i);
          final Coordinates childCoordinates = coordinates.getNthChild(i);
          newExecutableConfigValidator(child, childCoordinates);
        }
      }
    }

    @Override
    public Stream<ValidationError> validate() {
      return trie.values().stream().flatMap(Validator::validate);
    }
  }

  private class ExecutableConfigValidator implements Validator {

    private final ProcessConfigValidator parent;
    private final ExecutableConfig executableConfig;
    private final Coordinates coordinates;

    private ExecutableConfigValidator(ProcessConfigValidator parent,
        ExecutableConfig executableConfig, Coordinates coordinates) {
      this.parent = parent;
      this.executableConfig = executableConfig;
      this.coordinates = coordinates;
    }

    @Override
    public Stream<ValidationError> validate() {
      return null;
    }
  }

}
