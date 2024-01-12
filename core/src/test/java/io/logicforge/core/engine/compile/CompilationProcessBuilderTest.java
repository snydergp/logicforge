package io.logicforge.core.engine.compile;

import io.logicforge.core.annotations.Action;
import io.logicforge.core.annotations.Function;
import io.logicforge.core.common.Pair;
import io.logicforge.core.engine.ActionExecutor;
import io.logicforge.core.engine.LogicForgeOptions;
import io.logicforge.core.engine.Process;
import io.logicforge.core.exception.EngineInitializationException;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.injectable.ModifiableExecutionContext;
import io.logicforge.core.injectable.impl.DefaultModifiableExecutionContext;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.configuration.impl.DefaultActionConfig;
import io.logicforge.core.model.configuration.impl.DefaultFunctionConfig;
import io.logicforge.core.model.configuration.impl.DefaultProcessConfig;
import io.logicforge.core.model.configuration.impl.DefaultValueConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.ComputedParameterSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.EngineSpecBuilder;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.ParameterSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class CompilationProcessBuilderTest {

  private ActionExecutor executor;

  @BeforeEach
  void setUp() throws EngineInitializationException {
    final LogicForgeOptions options =
        new LogicForgeOptions(Duration.of(1, ChronoUnit.SECONDS), new HashMap<>(), Duration.ZERO);
    final ExecutorService executorService =
        new ThreadPoolExecutor(1, 2, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(16));
    executor = new ActionExecutor(executorService, options);
    executor.start();
  }

  @Test
  void testBuildProcess_buildsProcess() throws ProcessConstructionException {
    final Functions functions = new Functions();
    final EngineSpec engineSpec = buildSpec(functions);
    final CompilationProcessBuilder compiler = new CompilationProcessBuilder(engineSpec);
    final ProcessConfig config = buildProcessConfig("Hello, ", "World!", 3, 5);
    final Process process = compiler.buildProcess(config);
    final ModifiableExecutionContext context = new DefaultModifiableExecutionContext();

    process.execute(context, executor);
    assertEquals(1, functions.recordedPairs.size());
    final Pair<String, Integer> recordedPair = functions.recordedPairs.get(0);
    assertEquals("Hello, World!", recordedPair.getLeft());
    assertEquals(Integer.valueOf(8), recordedPair.getRight());
  }

  private static ProcessConfig buildProcessConfig(final String concatA, final String concatB,
      final Integer addA, final Integer addB) {
    final DefaultProcessConfig config = new DefaultProcessConfig();
    config.setActions(List.of(
        buildRecordPairConfig(buildConcatConfig(concatA, concatB), buildAddConfig(addA, addB))));
    return config;
  }

  private static ActionConfig buildRecordPairConfig(final InputConfig a, final InputConfig b) {
    return DefaultActionConfig.builder().name("recordPair")
        .inputArguments(Map.of("a", List.of(a), "b", List.of(b))).build();
  }

  private static InputConfig buildConcatConfig(final String a, final String b) {
    return DefaultFunctionConfig.builder().name("concat").arguments(Map.of("a",
        List.of(DefaultValueConfig.builder().typeId(String.class.getName()).value(a).build()), "b",
        List.of(DefaultValueConfig.builder().typeId(String.class.getName()).value(b).build())))
        .build();
  }

  private static InputConfig buildAddConfig(final int a, final int b) {
    return DefaultFunctionConfig.builder().name("add")
        .arguments(Map.of("a",
            List.of(DefaultValueConfig.builder().typeId(Integer.class.getName())
                .value(Integer.toString(a)).build()),
            "b", List.of(DefaultValueConfig.builder().typeId(Integer.class.getName())
                .value(Integer.toString(b)).build())))
        .build();
  }

  private static EngineSpec buildSpec(final Functions functions) {
    return new EngineSpecBuilder().withAction(Functions.recordPair(functions))
        .withFunction(Functions.add(functions)).withFunction(Functions.concat(functions)).build();
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
        final List<ParameterSpec> parameters =
            List.of(new ComputedParameterSpecImpl("a", String.class, false),
                new ComputedParameterSpecImpl("b", Integer.class, false));
        return new ActionSpecImpl("recordPair", method, functions, parameters);
      } catch (NoSuchMethodException e) {
        throw new RuntimeException(e);
      }
    }

    public static FunctionSpec concat(final Functions functions) {
      final Method method;
      try {
        method = Functions.class.getMethod("concat", String.class, String.class);
        final List<ParameterSpec> parameters =
            List.of(new ComputedParameterSpecImpl("a", String.class, false),
                new ComputedParameterSpecImpl("b", String.class, false));
        return new FunctionSpecImpl("concat", String.class, method, functions, parameters);
      } catch (NoSuchMethodException e) {
        throw new RuntimeException(e);
      }
    }

    public static FunctionSpec add(final Functions functions) {
      final Method method;
      try {
        method = Functions.class.getMethod("add", Integer.class, Integer.class);
        final List<ParameterSpec> parameters =
            List.of(new ComputedParameterSpecImpl("a", Integer.class, false),
                new ComputedParameterSpecImpl("b", Integer.class, false));
        return new FunctionSpecImpl("add", String.class, method, functions, parameters);
      } catch (NoSuchMethodException e) {
        throw new RuntimeException(e);
      }
    }
  }

  @RequiredArgsConstructor
  @Getter
  public static class ComputedParameterSpecImpl implements ComputedParameterSpec {
    private final String name;
    private final Class<?> type;
    private final boolean multi;
  }

  @RequiredArgsConstructor
  @Getter
  public static class ActionSpecImpl implements ActionSpec {
    private final String name;
    private final Method method;
    private final Object provider;
    private final List<ParameterSpec> parameters;
  }

  @RequiredArgsConstructor
  @Getter
  public static class FunctionSpecImpl implements FunctionSpec {
    private final String name;
    private final Class<?> outputType;
    private final Method method;
    private final Object provider;
    private final List<ParameterSpec> parameters;
  }
}
