package io.logicforge.demo.config;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.core.TreeNode;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.node.TextNode;
import io.logicforge.core.constant.ControlStatementType;
import io.logicforge.core.constant.ExecutableType;
import io.logicforge.core.constant.ExpressionType;
import io.logicforge.core.model.dto.config.ActionConfigDTO;
import io.logicforge.core.model.dto.config.ConditionalConfigDTO;
import io.logicforge.core.model.dto.config.ControlStatementConfigDTO;
import io.logicforge.core.model.dto.config.ExecutableConfigDTO;
import io.logicforge.core.model.dto.config.ExpressionConfigDTO;
import io.logicforge.core.model.dto.config.FunctionConfigDTO;
import io.logicforge.core.model.dto.config.ReferenceConfigDTO;
import io.logicforge.core.model.dto.config.ValueConfigDTO;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
@Slf4j
public class JacksonConfig {

  @Bean
  public Jackson2ObjectMapperBuilder objectMapperBuilder() {
    Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
    builder.deserializersByType(customDeserializers());
    return builder;
  }

  private Map<Class<?>, JsonDeserializer<?>> customDeserializers() {
    final Map<Class<?>, JsonDeserializer<?>> out = new HashMap<>();
    out.put(ExpressionConfigDTO.class, new ExpressionConfigDTODeserializer());
    out.put(ExecutableConfigDTO.class, new ExecutableConfigDTODeserializer());
    out.put(ControlStatementConfigDTO.class, new ControlStatementConfigDTODeserializer());
    return out;
  }

  public static class ExpressionConfigDTODeserializer extends StdDeserializer<ExpressionConfigDTO> {

    private static final String DIFFERENTIATOR_PROP = "differentiator";

    protected ExpressionConfigDTODeserializer() {
      super(ExpressionConfigDTO.class);
    }

    @Override
    public ExpressionConfigDTO deserialize(final JsonParser jsonParser,
        final DeserializationContext deserializationContext) throws IOException, JacksonException {
      final ObjectCodec codec = jsonParser.getCodec();
      final TreeNode treeNode = codec.readTree(jsonParser);
      final String differentiator = ((TextNode) treeNode.get(DIFFERENTIATOR_PROP)).asText();
      final ExpressionType expressionType = ExpressionType.valueOf(differentiator);
      log.info("expression: " + differentiator);
      switch (expressionType) {
        case FUNCTION -> {
          return codec.treeToValue(treeNode, FunctionConfigDTO.class);
        }
        case REFERENCE -> {
          return codec.treeToValue(treeNode, ReferenceConfigDTO.class);
        }
        case VALUE -> {
          return codec.treeToValue(treeNode, ValueConfigDTO.class);
        }
      }
      throw new IllegalStateException(
          "ExpressionConfigDTO JSON contains invalid differentiator field: %s".formatted(
              differentiator));
    }
  }


  public static class ExecutableConfigDTODeserializer extends StdDeserializer<ExecutableConfigDTO> {

    private static final String DIFFERENTIATOR_PROP = "differentiator";

    protected ExecutableConfigDTODeserializer() {
      super(ExecutableConfigDTO.class);
    }

    @Override
    public ExecutableConfigDTO deserialize(final JsonParser jsonParser,
        final DeserializationContext deserializationContext) throws IOException, JacksonException {
      final ObjectCodec codec = jsonParser.getCodec();
      final TreeNode treeNode = codec.readTree(jsonParser);
      final String differentiator = ((TextNode) treeNode.get(DIFFERENTIATOR_PROP)).asText();
      final ExecutableType expressionType = ExecutableType.valueOf(differentiator);
      switch (expressionType) {
        case ACTION -> {
          return codec.treeToValue(treeNode, ActionConfigDTO.class);
        }
        case CONTROL_STATEMENT -> {
          return codec.treeToValue(treeNode, ControlStatementConfigDTO.class);
        }
      }
      throw new IllegalStateException(
          "ExecutableConfigDTO JSON contains invalid differentiator field: %s".formatted(
              differentiator));
    }
  }


  public static class ControlStatementConfigDTODeserializer extends
      StdDeserializer<ControlStatementConfigDTO> {

    private static final String DIFFERENTIATOR_PROP = "controlType";

    protected ControlStatementConfigDTODeserializer() {
      super(ExecutableConfigDTO.class);
    }

    @Override
    public ControlStatementConfigDTO deserialize(final JsonParser jsonParser,
        final DeserializationContext deserializationContext) throws IOException, JacksonException {
      final ObjectCodec codec = jsonParser.getCodec();
      final TreeNode treeNode = codec.readTree(jsonParser);
      final String differentiator = ((TextNode) treeNode.get(DIFFERENTIATOR_PROP)).asText();
      final ControlStatementType expressionType = ControlStatementType.valueOf(differentiator);
      if (expressionType == ControlStatementType.CONDITIONAL) {
        return codec.treeToValue(treeNode, ConditionalConfigDTO.class);
      }
      throw new IllegalStateException(
          "ExecutableConfigDTO JSON contains invalid differentiator field: %s".formatted(
              differentiator));
    }
  }

}
