package io.logicforge.core.engine.compile;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.common.Pair;
import io.logicforge.core.exception.EngineConfigurationException;
import io.logicforge.core.exception.EngineInitializationException;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.BlockConfig;
import io.logicforge.core.model.configuration.ExpressionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.EngineSpecBuilder;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.InputSpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.mockito.MockitoAnnotations.openMocks;

@ExtendWith(MockitoExtension.class)
public class CompilationProcessBuilderTest {

  @Mock
  private ProcessCompiler compiler;

  @BeforeEach
  void setUp() throws EngineInitializationException {
    openMocks(this);
  }

  @Test
  void testBuildProcess_buildsProcess() throws ProcessConstructionException, EngineConfigurationException {
    final Functions functions = new Functions();
    final EngineSpec engineSpec = buildSpec(functions);
    final CompilationProcessBuilder builder = new CompilationProcessBuilder(engineSpec, compiler);
    final ProcessConfig config = buildProcessConfig("Hello, ", "World!", 3, 5);
    builder.buildProcess(config);

    // TODO snapshot compare of source file
  }

  private static ProcessConfig buildProcessConfig(final String concatA, final String concatB,
                                                  final Integer addA, final Integer addB) {
    final BlockConfig blockConfig = new BlockConfig(List.of(
            buildRecordPairConfig(buildConcatConfig(concatA, concatB), buildAddConfig(addA, addB))));
    return ProcessConfig.builder().name("example").rootBlock(blockConfig).allowConcurrency(false).build();
  }

  private static ActionConfig buildRecordPairConfig(final ExpressionConfig a,
                                                    final ExpressionConfig b) {
    return ActionConfig.builder().name("recordPair")
            .inputs(Map.of("a", List.of(a), "b", List.of(b))).build();
  }

  private static ExpressionConfig buildConcatConfig(final String a, final String b) {
    return FunctionConfig.builder().name("concat").arguments(Map.of("a",
                    List.of(ValueConfig.builder().typeId(String.class.getName()).value(a).build()), "b",
                    List.of(ValueConfig.builder().typeId(String.class.getName()).value(b).build())))
            .build();
  }

  private static ExpressionConfig buildAddConfig(final int a, final int b) {
    return FunctionConfig.builder().name("add")
            .arguments(Map.of("a",
                    List.of(ValueConfig.builder().typeId(Integer.class.getName())
                            .value(Integer.toString(a)).build()),
                    "b", List.of(ValueConfig.builder().typeId(Integer.class.getName())
                            .value(Integer.toString(b)).build())))
            .build();
  }

  private static EngineSpec buildSpec(final Functions functions) throws EngineConfigurationException {
    return new EngineSpecBuilder()
            .withAction(Functions.recordPair(functions))
            .withFunction(Functions.add(functions))
            .withFunction(Functions.concat(functions))
            .build();
  }

  public static class Functions {

    public List<Pair<String, Integer>> recordedPairs = new ArrayList<>();

    @Action
    public void recordPair(final String a, final Integer b) {
      recordedPairs.add(new Pair<>(a, b));
    }

    @Function
    public String concat(final String a, final String b) {
      return a + b;
    }

    @Function
    public Integer add(final Integer a, final Integer b) {
      return a + b;
    }

    public static ActionSpec recordPair(final Functions functions) {
      final Method method;
      try {
        method = Functions.class.getMethod("recordPair", String.class, Integer.class);
        final List<InputSpec> parameters = List.of(new InputSpec("a", String.class, false),
                new InputSpec("b", Integer.class, false));
        return new ActionSpec("recordPair", method, functions, parameters, Void.class);
      } catch (NoSuchMethodException e) {
        throw new RuntimeException(e);
      }
    }

    public static FunctionSpec concat(final Functions functions) {
      final Method method;
      try {
        method = Functions.class.getMethod("concat", String.class, String.class);
        final List<InputSpec> parameters = List.of(new InputSpec("a", String.class, false),
                new InputSpec("b", String.class, false));
        return new FunctionSpec("concat", method, functions, parameters, String.class);
      } catch (NoSuchMethodException e) {
        throw new RuntimeException(e);
      }
    }

    public static FunctionSpec add(final Functions functions) {
      final Method method;
      try {
        method = Functions.class.getMethod("add", Integer.class, Integer.class);
        final List<InputSpec> parameters = List.of(new InputSpec("a", Integer.class, false),
                new InputSpec("b", Integer.class, false));
        return new FunctionSpec("add", method, functions, parameters, String.class);
      } catch (NoSuchMethodException e) {
        throw new RuntimeException(e);
      }
    }
  }
}
