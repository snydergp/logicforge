package io.logicforge.core.engine.compile;

import static io.logicforge.core.common.Coordinates.ROOT;

import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.common.Coordinates;
import io.logicforge.core.common.Pair;
import io.logicforge.core.common.TypedArgument;
import io.logicforge.core.engine.Action;
import io.logicforge.core.engine.ExecutionContext;
import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.engine.Process;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.engine.impl.DefaultExecutionContext;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.model.domain.config.ActionConfig;
import io.logicforge.core.model.domain.config.BlockConfig;
import io.logicforge.core.model.domain.config.ConditionalConfig;
import io.logicforge.core.model.domain.config.ExecutableConfig;
import io.logicforge.core.model.domain.config.ExpressionConfig;
import io.logicforge.core.model.domain.config.FunctionConfig;
import io.logicforge.core.model.domain.config.ProcessConfig;
import io.logicforge.core.model.domain.config.ReferenceConfig;
import io.logicforge.core.model.domain.config.ValueConfig;
import io.logicforge.core.model.domain.specification.CallableSpec;
import io.logicforge.core.model.domain.specification.EngineSpec;
import io.logicforge.core.model.domain.specification.InputSpec;
import io.logicforge.core.model.domain.specification.ProvidedCallableSpec;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class CompilationProcessBuilder implements ProcessBuilder {

  private static final String PACKAGE_TPL = "io.logicforge.generated.%s";

  /**
   * The top-level template used for rendering process source files for compilation. This template
   * requires the following parameters:
   *
   * <ol>
   * <li>The package name to for the generated class</li>
   * <li>A string containing a list of formatted import statements</li>
   * <li>The process interface class name</li>
   * <li>A string containing a formatted list of fields and a constructor injecting those
   * fields</li>
   * <li>The signature for the process executor method</li>
   * <li>Method calls for loading the process arguments into the "args" map</li>
   * <li>The EngineSpec instance var name and queue var name (comma-separated)</li>
   * <li>the executable method calls</li>
   * <li>the function's return statement</li>
   * <li>The Process's unique ID string</li>
   * </ol>
   */
  private static final String CLASS_FILE_TPL = """
      package %s;

      %s

      public class CompiledProcess implements %s {

      \tprivate final AtomicLong executionCount = new AtomicLong(0L);
      \tprivate final CoordinateTrie<Action> trie = new CoordinateTrie<>();

      %s
      \t@Override
      \t%s {
      \t\tfinal long executionNumber = executionCount.getAndIncrement();
      \t\tfinal Map<String, Object> args = new HashMap<>();
      %s
      \t\tfinal ExecutionContext context = new DefaultExecutionContext(%s, args);
      \t\t%s
      \t\tcontext.await();%s
      \t}

      \tpublic String getProcessId() {
      \t\treturn "%s";
      \t}

      \tpublic long getExecutionCount() {
      \t\treturn executionCount.get();
      \t}
      }
      """;

  /**
   * A template usd to generate the top-level class instance var definitions and constructor. This
   * template requires the following parameters:
   *
   * <ol>
   * <li>A formatted list of instance variable declarations (indented one tab)</li>
   * <li>A formatted list of instance variable constructor parameters (comma separated)</li>
   * <li>A formatted list of instance variable initializations (indented two tabs)</li>
   * </ol>
   */
  private static final String PROCESS_CONSTRUCTOR_TPL = """
      %s

      \tpublic CompiledProcess(%s) {
      \t\t// initialize instance variables
      %s
      \t}
         """;

  private static final Set<Class<?>> DEFAULT_IMPORTS = Set.of(Action.class, ExecutionContext.class,
      DefaultExecutionContext.class, AtomicLong.class, Coordinates.class, CoordinateTrie.class,
      Map.class, HashMap.class);

  private static final Map<Class<?>, Class<?>> BOXED_TYPE_MAPPING = Map.of(boolean.class,
      Boolean.class, int.class, Integer.class, long.class, Long.class, float.class, Float.class,
      double.class, Double.class, byte.class, Byte.class, char.class, Character.class);

  private final EngineSpec engineSpec;
  private final ProcessCompiler compiler;

  private final AtomicLong processCounter = new AtomicLong(0);

  @Override
  public <T extends Process> T buildProcess(final ProcessConfig<T, ?> processConfig,
      final ExecutionQueue queue) throws ProcessConstructionException {
    final Class<T> functionalInterface = processConfig.getFunctionalInterface();
    final SourceFileData sourceFileData = new SourceFileData(processConfig, queue,
        functionalInterface);
    final String className = sourceFileData.getClassName();
    final String code = sourceFileData.getContents();
    final List<TypedArgument> args = sourceFileData.getInstanceVariables();
    return compiler.compileAndInstantiate(className, code, args, functionalInterface);
  }

  public interface SourceSegment {

    String getContents(final int tabCount);
  }


  private class SourceFileData {

    private final Map<Class<?>, Pair<String, String>> toImport = new HashMap<>();
    private final Map<Object, Pair<Class<?>, String>> instanceVars = new LinkedHashMap<>();
    private final long processId;

    private final ProcessConfig<?, ?> config;
    private final CallableSpec processSpec;
    private final String engineSpecVarName;
    private final String queueVarName;
    private final String processInterfaceName;
    @Getter
    private final String contents;
    private final BlockData rootBlock;

    private SourceFileData(final ProcessConfig<?, ?> config, final ExecutionQueue queue,
        final Class<?> processInterfaceClass) throws ProcessConstructionException {
      this.processId = processCounter.getAndIncrement();
      this.config = config;
      this.engineSpecVarName = ensureInstanceVar(engineSpec);
      this.queueVarName = ensureInstanceVar(queue, ExecutionQueue.class);
      this.processSpec = engineSpec.getProcesses()
          .values()
          .stream()
          .filter(spec -> spec.getMethod().getDeclaringClass().equals(processInterfaceClass))
          .findFirst()
          .orElseThrow(() -> new ProcessConstructionException(
              ("Supplied process interface %s has not been " + "registered").formatted(
                  processInterfaceClass)));
      this.processInterfaceName = ensureImport(processSpec.getMethod().getDeclaringClass());

      DEFAULT_IMPORTS.forEach(this::ensureImport);

      final BlockConfig rootBlock = config.getRootBlock();
      this.rootBlock = new BlockData(this, rootBlock, ROOT);
      this.contents = generateContents();
    }

    public String ensureInstanceVar(final Object object) {
      return ensureInstanceVar(object, object.getClass());
    }

    public String ensureInstanceVar(final Object object, final Class<?> type) {
      ensureImport(type);
      return instanceVars.computeIfAbsent(object, obj -> new Pair<>(type, "var" + instanceVars
          .size())).getRight();
    }

    public String ensureImport(final Class<?> classToImport) {
      return toImport.computeIfAbsent(classToImport, c -> {
        final List<String> nestedSegmentNames = new ArrayList<>();
        Class<?> pointer = c;
        final Class<?> root;
        while (true) {
          nestedSegmentNames.addFirst(pointer.getSimpleName());
          if (pointer.getEnclosingClass() == null) {
            root = pointer;
            break;
          }
          pointer = pointer.getEnclosingClass();
        }
        return new Pair<>(root.getName(), String.join(".", nestedSegmentNames));
      }).getRight();
    }

    public String getClassName() {
      return formatPackageName() + ".Process";
    }

    public String generateContents() {

      // Executable calls an return statement should be formatted first to ensure all
      // needed import statements and instance vars are captured
      final String executableCalls = formatExecutableCalls();
      final String returnStatement = formatReturnStatement();

      return CLASS_FILE_TPL.formatted(formatPackageName(), formatImports(), processInterfaceName,
          formatFieldsAndConstructor(), formatMethodSignature(), formatArgsLoadingLogic(), "%s, %s"
              .formatted(engineSpecVarName, queueVarName), executableCalls, returnStatement,
          processId);
    }

    private String formatPackageName() {
      return PACKAGE_TPL.formatted("process_" + processId);
    }

    private String formatImports() {
      return toImport.values()
          .stream()
          .map(Pair::getLeft)
          .sorted()
          .distinct()
          .map("import %s;"::formatted)
          .collect(Collectors.joining("\n"));
    }

    private String formatFieldsAndConstructor() {
      final String fieldDeclarations = instanceVars.values().stream().map(typeNamePair -> {
        final Class<?> type = typeNamePair.getLeft();
        final String typeRef = toImport.get(type).getRight();
        final String instanceVarName = typeNamePair.getRight();
        return "\tfinal %s %s;".formatted(typeRef, instanceVarName);
      }).collect(Collectors.joining("\n"));
      final String constructorArgs = instanceVars.values().stream().map(typeNamePair -> {
        final Class<?> type = typeNamePair.getLeft();
        final String typeRef = toImport.get(type).getRight();
        final String instanceVarName = typeNamePair.getRight();
        return "final %s %s".formatted(typeRef, instanceVarName);
      }).collect(Collectors.joining(", "));
      final String fieldInitializations = instanceVars.values()
          .stream()
          .map(Pair::getRight)
          .map(instanceVarName -> "\t\tthis.%s = %s;".formatted(instanceVarName, instanceVarName))
          .collect(Collectors.joining("\n"));

      return PROCESS_CONSTRUCTOR_TPL.formatted(fieldDeclarations, constructorArgs,
          fieldInitializations);
    }

    private String formatMethodSignature() {
      final StringBuilder builder = new StringBuilder();
      final Method method = processSpec.getMethod();
      final Class<?> returnType = method.getReturnType();
      builder.append("\tpublic ")
          .append(Void.class.equals(returnType) ? "void" : ensureImport(returnType))
          .append(" ")
          .append(method.getName())
          .append("(");
      for (int i = 0; i < processSpec.getInputs().size(); i++) {
        builder.append(i > 0 ? ", " : "");
        final InputSpec input = processSpec.getInputs().get(i);
        final String name = input.getName();
        final boolean multi = input.isMulti();
        final Class<?> type = input.getType();
        final String typeName = ensureImport(type);
        builder.append("final ").append(typeName).append(multi ? "[] " : " ").append(name);
      }
      builder.append(")");
      return builder.toString();
    }

    private String formatArgsLoadingLogic() {
      final StringBuilder builder = new StringBuilder();
      for (final InputSpec input : processSpec.getInputs()) {
        final String name = input.getName();
        builder.append("\t\targs.put(\"").append(name).append("\", ").append(name).append(");\n");
      }
      return builder.toString();
    }

    private String formatExecutableCalls() {
      return rootBlock.getContents(2);
    }

    private String formatReturnStatement() {
      final Class<?> type = processSpec.getType();
      if (Void.class.equals(type)) {
        return "";
      } else {
        final List<ExpressionConfig> returnStatement = config.getReturnExpression();
        final ExpressionData expressionData;
        if (processSpec.getType().isArray()) {
          expressionData = new ArrayExpressionData(this, returnStatement, type);
        } else {
          // TODO add validation and handling
          expressionData = mapExpression(this, returnStatement.getFirst(), type);
        }
        return "\n\t\treturn %s;".formatted(expressionData.getContents(0));
      }
    }

    public List<TypedArgument> getInstanceVariables() {
      return instanceVars.entrySet()
          .stream()
          .map(e -> TypedArgument.from(e.getValue().getLeft(), e.getKey()))
          .collect(Collectors.toList());
    }
  }


  @RequiredArgsConstructor
  @Getter
  private abstract class ExecutableData implements SourceSegment {

    protected final SourceFileData sourceFile;

    protected final Coordinates coordinates;

  }


  private class BlockData extends ExecutableData {

    private final List<ExecutableData> children = new ArrayList<>();

    private BlockData(final SourceFileData sourceFile, final BlockConfig config,
        final Coordinates coordinates) {
      super(sourceFile, coordinates);

      for (int i = 0; i < config.getExecutables().size(); i++) {
        final ExecutableConfig childConfig = config.getExecutables().get(i);
        final Coordinates childCoordinates = coordinates.getNthChild(i);
        switch (childConfig) {
          case ActionConfig actionConfig -> children.add(new ActionData(sourceFile, actionConfig,
              childCoordinates));
          case ConditionalConfig conditionalConfig -> children.add(new ConditionalData(sourceFile,
              conditionalConfig, childCoordinates));
          default -> throw new IllegalStateException("Unknown executable type: %s".formatted(
              childConfig.getClass()));
        }
      }
    }

    @Override
    public String getContents(final int tabCount) {
      final StringBuilder builder = new StringBuilder();
      for (final ExecutableData child : children) {
        builder.append(child.getContents(tabCount));
      }
      return builder.toString();
    }
  }


  public class ActionData extends ExecutableData {

    private final ActionConfig config;

    private ActionData(final SourceFileData sourceFile, final ActionConfig config,
        final Coordinates coordinates) {
      super(sourceFile, coordinates);
      this.config = config;
    }

    @Override
    public String getContents(final int tabCount) {
      final String tab = tabs(tabCount);
      final StringBuilder builder = new StringBuilder();
      builder.append(tab)
          .append("// Action {")
          .append(coordinates.asFormattedString(","))
          .append("}")
          .append("\n")
          .append(tab);

      final ProvidedCallableSpec actionSpec = engineSpec.getActions().get(config.getName());
      final Class<?> outputType = actionSpec.getType();
      final CallableExpressionData expressionData = new CallableExpressionData(getSourceFile(),
          outputType, actionSpec, config.getArguments());

      boolean nonVoid = !void.class.equals(outputType);

      if (!nonVoid) {
        builder.append(expressionData.getContents(tabCount)).append("\n").append(tab);
      }
      builder.append("context.setVariable(")
          .append(coordinatesAsCodeInitializer(coordinates))
          .append(", ");
      if (nonVoid) {
        builder.append(expressionData.getContents(tabCount));
      } else {
        builder.append("null");
      }
      builder.append(");\n");

      return builder.toString();
    }
  }


  private class ConditionalData extends ExecutableData {

    private final ConditionalConfig config;
    private final BlockData thenData;
    private final BlockData elseData;

    public ConditionalData(final SourceFileData sourceFile, final ConditionalConfig config,
        final Coordinates coordinates) {
      super(sourceFile, coordinates);
      this.config = config;
      this.thenData = new BlockData(sourceFile, config.getThen(), coordinates.getNthChild(0));
      this.elseData = new BlockData(sourceFile, config.getElse(), coordinates.getNthChild(1));
    }

    @Override
    public String getContents(final int tabCount) {
      final StringBuilder builder = new StringBuilder();
      final String tab = tabs(tabCount);
      final ExpressionData conditional = mapExpression(sourceFile, config.getCondition(),
          boolean.class);
      builder.append(tab)
          .append("if (")
          .append(conditional.getContents(tabCount))
          .append(") {\n")
          .append(thenData.getContents(tabCount + 1))
          .append(tab)
          .append("} else {\n")
          .append(elseData.getContents(tabCount + 1))
          .append(tab)
          .append("}\n");
      return builder.toString();
    }
  }


  @Getter
  private static abstract class ExpressionData implements SourceSegment {

    protected final SourceFileData sourceFile;

    private ExpressionData(final SourceFileData sourceFile) {
      this.sourceFile = sourceFile;
    }
  }


  private class CallableExpressionData extends ExpressionData {

    private final Class<?> requiredType;
    private final Method method;
    private final Object provider;
    private final Class<?> outputType;

    private final List<ExpressionData> args;

    public CallableExpressionData(final SourceFileData sourceFile, final Class<?> requiredType,
        final ProvidedCallableSpec spec, Map<String, List<ExpressionConfig>> args) {
      this(sourceFile, requiredType, spec.getMethod(), spec.getProvider(), spec.getType(), spec
          .getInputs(), args);
    }

    private CallableExpressionData(final SourceFileData sourceFile, final Class<?> requiredType,
        final Method method, final Object provider, final Class<?> outputType,
        final List<InputSpec> inputSpecs, final Map<String, List<ExpressionConfig>> arguments) {
      super(sourceFile);

      this.requiredType = requiredType;
      this.method = method;
      this.provider = provider;
      this.outputType = outputType;
      this.args = inputSpecs.stream()
          .map(spec -> getArgument(spec, arguments.get(spec.getName())))
          .collect(Collectors.toList());
    }

    public ExpressionData getArgument(final InputSpec inputSpec,
        final List<ExpressionConfig> argument) {
      final Class<?> type = inputSpec.getType();
      final boolean multi = inputSpec.isMulti();
      if (multi) {
        return new ArrayExpressionData(getSourceFile(), argument, type);
      } else {
        final ExpressionConfig expressionConfig = argument.getFirst();
        return mapExpression(getSourceFile(), expressionConfig, type);
      }
    }

    @Override
    public String getContents(final int tabCount) {
      final String providerVar = this.getSourceFile().ensureInstanceVar(provider);
      final String functionName = method.getName();
      final String implementation = providerVar + "." + functionName + "(" + args.stream()
          .map(arg -> arg.getContents(tabCount))
          .collect(Collectors.joining(", ")) + ")";
      if (!requiredType.equals(outputType)) {
        return "context.convert(%s, %s.class)".formatted(implementation, getSourceFile()
            .ensureImport(requiredType));
      } else {
        return implementation;
      }
    }
  }


  private class ValueExpressionData extends ExpressionData {

    private final ValueConfig config;
    private final Class<?> type;
    @Getter
    private final String contents;

    private ValueExpressionData(final SourceFileData sourceFile, final ValueConfig config,
        final Class<?> type) {
      super(sourceFile);
      this.config = config;
      this.type = type;
      this.contents = generateContents();
    }

    public String generateContents() {
      final String value = config.getValue();
      if (type.equals(int.class) || type.equals(Integer.class) || type.equals(float.class) || type
          .equals(Float.class) || type.equals(byte.class) || type.equals(Byte.class) || type.equals(
              boolean.class) || type.equals(Boolean.class)) {
        // code representation is equivalent to string representation
        return value;
      } else if (type.equals(String.class)) {
        // strings require quotes
        return "\"" + value + "\"";
      } else if (type.equals(char.class) || type == Character.class) {
        // char requires single quotes
        return "'" + value + "'";
      } else if (type.equals(long.class) || type == Long.class) {
        // longs require "L" suffix
        return value + "L";
      } else if (type.equals(double.class) || type == Double.class) {
        // doubles require "D" suffix
        return value + "D";
      }
      throw new IllegalStateException("Type cannot be represented as value: " + type);
    }

    @Override
    public String getContents(final int tabCount) {
      return contents;
    }
  }


  private class VariableReferenceData extends ExpressionData {

    private final ReferenceConfig config;
    private final Class<?> type;

    private VariableReferenceData(final SourceFileData sourceFile, final ReferenceConfig config,
        final Class<?> type) {
      super(sourceFile);
      this.config = config;
      this.type = type;
    }

    @Override
    public String getContents(final int tabCount) {
      final StringBuilder writer = new StringBuilder();
      final Class<?> boxedType = BOXED_TYPE_MAPPING.getOrDefault(type, type);
      final String typeName = getSourceFile().ensureImport(boxedType);

      final Coordinates coordinates = config.getCoordinates();
      final List<String> path = Objects.requireNonNullElse(config.getPath(), List.of());
      writer.append("context.isVariableSet(")
          .append(coordinatesAsCodeInitializer(coordinates))
          .append(", ")
          .append(typeName)
          .append(".class");
      for (final String p : path) {
        writer.append(", \"").append(p).append("\"");
      }
      writer.append(")");
      writer.append(" ? ");
      writer.append("context.getVariable(")
          .append(coordinatesAsCodeInitializer(coordinates))
          .append(", ")
          .append(typeName)
          .append(".class");
      for (final String p : path) {
        writer.append(", \"").append(p).append("\"");
      }
      writer.append(")");
      writer.append(" : ");
      writer.append("null");
      writer.append(" ");
      return writer.toString();
    }
  }


  private class ArrayExpressionData extends ExpressionData {

    private final Class<?> type;
    private final List<ExpressionData> args;

    private ArrayExpressionData(final SourceFileData sourceFile,
        final List<ExpressionConfig> configs, final Class<?> type) {
      super(sourceFile);
      this.type = type;
      args = configs.stream()
          .map(config -> mapExpression(sourceFile, config, type))
          .collect(Collectors.toList());
      getSourceFile().ensureImport(type);
    }

    @Override
    public String getContents(final int tabCount) {
      final StringBuilder builder = new StringBuilder();
      final String typeName = getSourceFile().ensureImport(type);

      // output all expressions as an array
      builder.append("new ")
          .append(typeName)
          .append("[]{")
          .append(args.stream()
              .map(arg -> arg.getContents(tabCount))
              .collect(Collectors.joining(", ")))
          .append("}");
      return builder.toString();
    }
  }


  private ExpressionData mapExpression(final SourceFileData sourceFile,
      final ExpressionConfig config, final Class<?> requiredType) {
    if (config instanceof FunctionConfig functionConfig) {
      final ProvidedCallableSpec functionSpec = engineSpec.getFunctions()
          .get(functionConfig.getName());
      return new CallableExpressionData(sourceFile, requiredType, functionSpec, functionConfig
          .getArguments());
    } else if (config instanceof ValueConfig valueConfig) {
      return new ValueExpressionData(sourceFile, valueConfig, requiredType);
    } else if (config instanceof ReferenceConfig referenceConfig) {
      return new VariableReferenceData(sourceFile, referenceConfig, requiredType);
    }
    throw new IllegalStateException("Unknown expression config requiredType: " + config.getClass());
  }

  /**
   * Formats coordinates as a string that can be inserted into Java source code that will evaluate
   * as an identical instance of Coordinates at runtime
   */
  private static String coordinatesAsCodeInitializer(final Coordinates coordinates) {
    return "Coordinates.from(%s)".formatted(coordinates.asFormattedString(","));
  }

  private static String tabs(final int tabCount) {
    return "\t".repeat(Math.max(0, tabCount));
  }
}
