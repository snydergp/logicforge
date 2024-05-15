package io.logicforge.demo.config;

import io.logicforge.core.builtin.BuiltinProviders;
import io.logicforge.core.constant.ControlStatementType;
import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.engine.LogicForgeOptions;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.engine.compile.ProcessCompiler;
import io.logicforge.core.engine.impl.SimpleExecutionQueue;
import io.logicforge.core.exception.EngineConfigurationException;
import io.logicforge.core.model.domain.specification.EngineSpec;
import io.logicforge.core.model.domain.specification.EngineSpecBuilder;
import io.logicforge.demo.model.domain.WebServerProcess;
import io.logicforge.demo.operations.HttpOperations;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LogicForgeConfig {


  @Bean
  public HttpClient httpClient() {
    return HttpClient.newHttpClient();
  }

  @Bean
  public HttpOperations httpActions(final HttpClient client) {
    return new HttpOperations(client);
  }

  @Bean
  public EngineSpec engineSpec(final HttpOperations httpOperations)
      throws EngineConfigurationException {
    return new EngineSpecBuilder().withProviderClasses(BuiltinProviders.getBuiltinProviders())
        .withProcess(WebServerProcess.class)
        .withControls(ControlStatementType.CONDITIONAL)
        .withProviderInstance(httpOperations, false)
        .build();
  }

  @Bean
  public LogicForgeOptions logicForgeOptions() {
    return new LogicForgeOptions(Duration.of(10, ChronoUnit.SECONDS), new HashMap<>(),
        Duration.ZERO);
  }

  @Bean
  public ExecutorService executorService() {
    return new ThreadPoolExecutor(4, 16, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(128));
  }

  @Bean
  public ProcessCompiler processCompiler() {
    return new ProcessCompiler();
  }

  @Bean
  public ProcessBuilder processBuilder(final EngineSpec engineSpec,
      final ProcessCompiler processCompiler) {
    return new CompilationProcessBuilder(engineSpec, processCompiler);
  }

  @Bean
  public ExecutionQueue executionQueue() {
    final ExecutorService executorService = new ThreadPoolExecutor(4, 8, 10, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(100));
    return new SimpleExecutionQueue(executorService);
  }

}
