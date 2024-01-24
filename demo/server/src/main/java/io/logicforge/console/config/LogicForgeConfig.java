package io.logicforge.console.config;

import io.logicforge.core.builtin.BuiltinProviders;
import io.logicforge.core.engine.ActionExecutor;
import io.logicforge.core.engine.LogicForgeOptions;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.engine.compile.CompilationProcessBuilder;
import io.logicforge.core.model.specification.ContextVariableSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.EngineSpecBuilder;
import io.logicforge.core.model.specification.ProcessSpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class LogicForgeConfig {

  @Bean
  public ProcessSpec processSpec() {
    return new ProcessSpec() {
      @Override
      public String getName() {
        return "example";
      }

      @Override
      public List<ContextVariableSpec> getAvailableVariables() {
        return List.of();
      }

      @Override
      public List<ContextVariableSpec> getExpectedOutputVariables() {
        return List.of();
      }

      @Override
      public Optional<ContextVariableSpec> getReturnValue() {
        return Optional.empty();
      }
    };
  }

  @Bean
  public EngineSpec engineSpec(final ProcessSpec processSpec) {
    return new EngineSpecBuilder().withProviderClasses(BuiltinProviders.getBuiltinProviders())
        .withProcess(processSpec).build();
  }

  @Bean
  public ActionExecutor actionExecutor(final LogicForgeOptions logicForgeOptions,
      final ExecutorService executorService) {
    return new ActionExecutor(executorService, logicForgeOptions);
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
  public ProcessBuilder processBuilder(final EngineSpec engineSpec) {
    return new CompilationProcessBuilder(engineSpec);
  }

}
