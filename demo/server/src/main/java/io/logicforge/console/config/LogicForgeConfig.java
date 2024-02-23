package io.logicforge.console.config;

import io.logicforge.core.builtin.BuiltinProviders;
import io.logicforge.core.engine.LogicForgeOptions;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.engine.compile.ProcessCompiler;
import io.logicforge.core.exception.EngineConfigurationException;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.EngineSpecBuilder;
import io.logicforge.core.model.specification.ProcessSpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class LogicForgeConfig {

  @Bean
  public ProcessSpec processSpec() {
    return new ProcessSpec("example", new ArrayList<>(), null);
  }

  @Bean
  public EngineSpec engineSpec(final ProcessSpec processSpec) throws EngineConfigurationException {
    return new EngineSpecBuilder().withProviderClasses(BuiltinProviders.getBuiltinProviders())
        .withProcess(processSpec).build();
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
  public ProcessBuilder processBuilder(final EngineSpec engineSpec, final ProcessCompiler processCompiler) {
    return new CompilationProcessBuilder(engineSpec, processCompiler);
  }

}
