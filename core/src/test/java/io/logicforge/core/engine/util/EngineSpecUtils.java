package io.logicforge.core.engine.util;

import static io.logicforge.core.common.Coordinates.ROOT;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.elements.Converter;
import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.common.Pair;
import io.logicforge.core.engine.Process;
import io.logicforge.core.exception.EngineConfigurationException;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.BlockConfig;
import io.logicforge.core.model.configuration.ExpressionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.configuration.ReferenceConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.EngineSpecBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

public class EngineSpecUtils {

  /**
   * Builds a process implementing the {@link TestProcess} interface which takes in two parameters (String text and int
   * number) and performs the following actions;
   *
   * <ol>
   * <li>Record the pair {concatA + text (String), addA + number (Integer)} and store the summed integer value</li>
   * <li>Record the pair {concatB + text (String), addB + number (Integer)} and store the summed integer value</li>
   * </ol>
   * <p>
   * The process then returns to the caller the string <code>"The sum is"</code> followed by the total sum from the two
   * pairs
   * <p>
   * The recorded pairs can be accessed from the Functions instance supplied to the {@link EngineSpecBuilder} for
   * verification.
   * <p>
   * So <code>buildBasicProcessConfig("Hello, ", 3, "Hi, ", 7)</code> should return a process that returns the String
   * <code>"The sum is 42"</code> when called with <code>doTheThing("World!", 16)</code>
   *
   * @param concatA
   * @param addA
   * @param concatB
   * @param addB
   * @return
   */
  public static ProcessConfig<TestProcess> buildBasicProcessConfig(final String concatA,
      final Integer addA, final String concatB, final Integer addB) {
    final BlockConfig blockConfig = new BlockConfig(List.of(buildAsyncStringConfig("The sum is "),
        buildRecordPairConfig(buildConcatConfig(concatA), buildAddConfig(addA)),
        buildRecordPairConfig(buildConcatConfig(concatB), buildAddConfig(addB))));
    final FunctionConfig returnFunction =
        FunctionConfig
            .builder().name(
                "concat")
            .arguments(Map.of("a",
                List.of(ReferenceConfig.builder()
                    .reference(
                        ReferenceConfig.Reference.builder().coordinateList(List.of(0)).build())
                    .build()),
                "b",
                List.of(
                    FunctionConfig.builder().name("add")
                        .arguments(
                            Map.of("a",
                                List.of(ReferenceConfig.builder()
                                    .reference(ReferenceConfig.Reference
                                        .builder().coordinateList(List.of(1)).build())
                                    .build()),
                                "b",
                                List.of(ReferenceConfig.builder()
                                    .reference(ReferenceConfig.Reference.builder()
                                        .coordinateList(List.of(2)).build())
                                    .build())))
                        .build())))
            .build();
    return ProcessConfig.<TestProcess>builder().functionalInterface(TestProcess.class)
        .name("example").rootBlock(blockConfig).returnStatement(returnFunction).build();
  }

  private static ActionConfig buildAsyncStringConfig(final String string) {
    return ActionConfig.builder().name("asyncString")
        .arguments(Map.of("s", List.of(ValueConfig.builder().value(string).build()))).build();
  }

  private static ActionConfig buildRecordPairConfig(final ExpressionConfig a,
      final ExpressionConfig b) {
    return ActionConfig.builder().name("recordPair")
        .arguments(Map.of("a", List.of(a), "b", List.of(b))).build();
  }

  private static ExpressionConfig buildConcatConfig(final String a) {
    return FunctionConfig.builder().name("concat")
        .arguments(
            Map.of("a", List.of(ValueConfig.builder().value(a).build()), "b",
                List.of(ReferenceConfig.builder().reference(ReferenceConfig.Reference.builder()
                    .coordinateList(ROOT.asList()).path(List.of("text")).build()).build())))
        .build();
  }

  private static ExpressionConfig buildAddConfig(final int a) {
    return FunctionConfig
        .builder().name(
            "add")
        .arguments(
            Map.of("a", List.of(ValueConfig.builder().value(Integer.toString(a)).build()), "b",
                List.of(
                    ReferenceConfig
                        .builder().reference(ReferenceConfig.Reference.builder()
                            .coordinateList(ROOT.asList()).path(List.of("number")).build())
                        .build())))
        .build();
  }

  public static EngineSpec buildSpec(final Functions functions)
      throws EngineConfigurationException {
    return new EngineSpecBuilder().withProviderInstance(functions, true)
        .withProcess(TestProcess.class).build();
  }

  public interface TestProcess extends Process {

    String doTheThing(final String text, final int number);

  }

  public static class Functions {

    public List<Pair<String, Integer>> recordedPairs = new ArrayList<>();

    @Action
    public Integer recordPair(final String a, final Integer b) {
      recordedPairs.add(new Pair<>(a, b));
      return b;
    }

    @Action
    public Callable<String> asyncString(final String s) {
      return () -> {
        Thread.sleep(0);
        return s;
      };
    }

    @Function
    public String concat(final String a, final String b) {
      return a + b;
    }

    @Function
    public Integer add(final Integer a, final Integer b) {
      return a + b;
    }

    @Converter
    public String integerToString(final Integer integer) {
      return integer.toString();
    }
  }
}
