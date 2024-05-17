package io.logicforge.core.validation;

import static io.logicforge.core.common.Coordinates.ROOT;

import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.common.Coordinates;
import io.logicforge.core.model.domain.config.BlockConfig;
import io.logicforge.core.model.domain.config.ControlStatementConfig;
import io.logicforge.core.model.domain.config.ExecutableConfig;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.domain.specification.EngineSpec;
import java.util.List;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;

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

    private final ProcessConfig<?, ?> processConfig;
    private final CoordinateTrie<ExecutableConfigValidator> trie = new CoordinateTrie<>();

    private ProcessConfigValidator(ProcessConfig<?, ?> processConfig) {
      this.processConfig = processConfig;
      BlockConfig rootBlock = processConfig.getRootBlock();
      for (int executableIndex = 0; executableIndex < rootBlock.getExecutables().size();
          executableIndex++) {
        final ExecutableConfig executable = rootBlock.getExecutables().get(executableIndex);
        final Coordinates executableCoordinates = ROOT.getNthChild(executableIndex);
        newExecutableConfigValidator(executable, executableCoordinates);
      }
    }

    private void newExecutableConfigValidator(final ExecutableConfig config,
        final Coordinates coordinates) {
      final ExecutableConfigValidator validator = new ExecutableConfigValidator(this, config,
          coordinates);
      trie.put(coordinates, validator);

      if (config instanceof ControlStatementConfig controlStatementConfig) {
        for (int blockIndex = 0; blockIndex < controlStatementConfig.getBlocks().size();
            blockIndex++) {
          final BlockConfig block = controlStatementConfig.getBlocks().get(blockIndex);
          final Coordinates blockCoordinates = coordinates.getNthChild(blockIndex);
          for (int executableIndex = 0; executableIndex < block.getExecutables().size();
              executableIndex++) {
            final ExecutableConfig executable = block.getExecutables().get(executableIndex);
            final Coordinates executableCoordinates = blockCoordinates.getNthChild(executableIndex);
            newExecutableConfigValidator(executable, executableCoordinates);
          }
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
