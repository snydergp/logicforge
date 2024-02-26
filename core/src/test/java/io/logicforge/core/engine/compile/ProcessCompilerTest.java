package io.logicforge.core.engine.compile;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.logicforge.core.common.TypedArgument;
import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.engine.impl.SimpleExecutionQueue;
import io.logicforge.core.engine.util.EngineSpecUtils;
import io.logicforge.core.engine.util.FileUtil;
import io.logicforge.core.exception.EngineConfigurationException;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.specification.EngineSpec;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProcessCompilerTest {

  private static final String BASIC_CLASSNAME = "io.logicforge.generated.process_0.CompiledProcess";

  private ProcessCompiler compiler;
  private EngineSpecUtils.Functions functions;
  private EngineSpec engineSpec;
  private ExecutorService executorService;
  private ExecutionQueue queue;

  @BeforeEach
  void setUp() throws EngineConfigurationException {
    compiler = new ProcessCompiler();
    functions = new EngineSpecUtils.Functions();
    engineSpec = EngineSpecUtils.buildSpec(functions);
    executorService =
        new ThreadPoolExecutor(4, 16, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(128));
    queue = new SimpleExecutionQueue(executorService);
  }

  @Test
  void compileAndInstantiate_compilesValidBasicProcess()
      throws IOException, ProcessConstructionException, InterruptedException {
    final String basicSource = FileUtil.loadGeneratedJavaFileSource("basic");
    final List<TypedArgument> constructorArgs =
        List.of(TypedArgument.from(EngineSpec.class, engineSpec),
            TypedArgument.from(ExecutionQueue.class, queue),
            TypedArgument.from(EngineSpecUtils.Functions.class, functions));
    final EngineSpecUtils.TestProcess testProcess = compiler.compileAndInstantiate(BASIC_CLASSNAME,
        basicSource, constructorArgs, EngineSpecUtils.TestProcess.class);

    final String text = "World!";
    final int number = 16;

    final String returnVal = testProcess.doTheThing(text, number);

    Thread.sleep(3000);

    assertEquals(2, functions.recordedPairs.size());
    assertEquals("Hello, World!", functions.recordedPairs.getFirst().getLeft());
    assertEquals(19, functions.recordedPairs.getFirst().getRight());
    assertEquals("Hi, World!", functions.recordedPairs.get(1).getLeft());
    assertEquals(23, functions.recordedPairs.get(1).getRight());
    assertEquals("The sum is 42", returnVal);

    // todo remove
    final int repetitions = 10000;
    {
      final long start = System.currentTimeMillis();
      for (int i = 0; i < repetitions; i++) {
        testProcess.doTheThing(Integer.toString(i), i);
      }
      final long end = System.currentTimeMillis();
      System.out.printf("Ran %s executions in %s milliseconds%n", repetitions, end - start);
    }
  }

  private String doTheThing(final String text, final Integer number) {
    final Integer a =
        functions.recordPair(functions.concat("Hello, ", text), functions.add(3, number));
    final Integer b =
        functions.recordPair(functions.concat("Hi, ", text), functions.add(7, number));
    return functions.concat("The sum is ", functions.integerToString(functions.add(a, b)));
  }
}
