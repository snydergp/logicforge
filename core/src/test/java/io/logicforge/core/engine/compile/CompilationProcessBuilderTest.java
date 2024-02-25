package io.logicforge.core.engine.compile;

import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.engine.impl.SimpleExecutionQueue;
import io.logicforge.core.engine.util.EngineSpecUtils;
import io.logicforge.core.engine.util.FileUtil;
import io.logicforge.core.exception.EngineConfigurationException;
import io.logicforge.core.exception.EngineInitializationException;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.specification.EngineSpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import static io.logicforge.core.engine.util.EngineSpecUtils.buildBasicProcessConfig;
import static io.logicforge.core.engine.util.EngineSpecUtils.buildSpec;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.MockitoAnnotations.openMocks;

@ExtendWith(MockitoExtension.class)
public class CompilationProcessBuilderTest {

  @Mock
  private ProcessCompiler compiler;
  private ExecutorService executorService;
  private ExecutionQueue queue;

  @Captor
  private ArgumentCaptor<String> sourceCaptor;

  @BeforeEach
  void setUp() {
    openMocks(this);
    executorService = new ThreadPoolExecutor(4, 16, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(128));
    queue = new SimpleExecutionQueue(executorService);
  }

  @Test
  void testBuildProcess_buildsBasicProcess() throws ProcessConstructionException, EngineConfigurationException,
          IOException {
    final EngineSpecUtils.Functions functions = new EngineSpecUtils.Functions();
    final EngineSpec engineSpec = buildSpec(functions);
    final CompilationProcessBuilder builder = new CompilationProcessBuilder(engineSpec, compiler);
    final ProcessConfig<EngineSpecUtils.TestProcess> config = buildBasicProcessConfig("Hello, ", 3, "Hi, ", 7);
    builder.buildProcess(config, queue);

    verify(compiler).compileAndInstantiate(anyString(), sourceCaptor.capture(), any(List.class),
            eq(EngineSpecUtils.TestProcess.class));
    final String basicSource = FileUtil.loadGeneratedJavaFileSource("basic");
    assertEquals(basicSource, sourceCaptor.getValue());
  }
}
