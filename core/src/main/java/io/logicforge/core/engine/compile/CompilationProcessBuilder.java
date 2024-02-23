package io.logicforge.core.engine.compile;

import io.logicforge.core.common.Pair;
import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.engine.Action;
import io.logicforge.core.engine.Process;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.exception.ProcessExecutionException;
import io.logicforge.core.engine.ExecutionContext;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.BlockConfig;
import io.logicforge.core.model.configuration.ConditionalConfig;
import io.logicforge.core.model.configuration.ControlStatementConfig;
import io.logicforge.core.model.configuration.ExecutableConfig;
import io.logicforge.core.model.configuration.ExpressionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.configuration.ReferenceConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.InputSpec;
import io.logicforge.core.model.specification.TypeSpec;
import io.logicforge.core.util.CoordinateUtils;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class CompilationProcessBuilder implements ProcessBuilder {

    private static final String PACKAGE_TPL = "io.logicforge.generated.%s";

    /**
     * The top-level template used for rendering process source files for compilation. This template requires the following
     * parameters:
     *
     * <ol>
     * <li>The package name to for the generated class</li>
     * <li>A string containing a list of formatted import statements</li>
     * <li>A string containing a formatted list of fields and a constructor injecting those fields</li>
     * <li>The Process's unique ID string</li>
     * <li>A formatted list of the Process's executables, defined as inner classes</li>
     * </ol>
     */
    private static final String CLASS_FILE_TPL = """
      package %s;

      %s

      public class CompiledProcess implements Process {

      \tprivate final AtomicLong executionCount = new AtomicLong(0L);
      \tprivate final CoordinateTrie<Action> trie = new CoordinateTrie<>();

      %s
      \tpublic void execute(final ExecutionContext context) {

      \t\tfinal long executionNumber = executionCount.getAndIncrement();
      \t\tfinal Action rootAction = trie.get(new int[0]);
      \t\tcontext.enqueue(rootAction);
      \t}

      \tpublic String getProcessId() {
      \t\treturn "%s";
      \t}

      \tpublic long getExecutionCount() {
      \t\treturn executionCount.get();
      \t}
      %s
      }
      """;

    /**
     * A template usd to generate the top-level class instance var definitions and constructor. This template requires the
     * following parameters:
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

      \t\t// initialize singleton actions and load action trie
      %s
      \t}
         """;

    /**
     * A template representing an action defined as an inner class. This template takes the following arguments:
     *
     * <ol>
     * <li>The class name</li>
     * <li>The executable coordinates, formatted as an array initializer</li>
     * <li>The executable dependency coordinates, formatted as a list of array initializers</li>
     * <li>The execution logic</li>
     * <li>The execution logic (to be outputted as a string for debugging)</li>
     * </ol>
     */
    private static final String ACTION_CLASS_TEMPLATE =
            """
                \tprivate class %s implements Action {
      
                \t\tprivate final int[] coordinates = %s;
                \t\tprivate final List<int[]> dependencyCoordinates = List.of(%s);
      
                \t\tpublic Object execute(final ExecutionContext context) throws ProcessExecutionException {
      
                \t\t\t%s;
                \t\t}
                          
                \t\tpublic int[] getCoordinates() {
                \t\t\treturn coordinates;
                \t\t}
                          
                \t\tpublic List<int[]> getDependencyCoordinates() {
                \t\t\treturn dependencyCoordinates;
                \t\t}
      
                \t\tpublic String toString() {
                \t\t\treturn "%s";
                \t\t}
                \t}""";

    private static final Set<Class<?>> DEFAULT_IMPORTS =
            Set.of(Process.class, Action.class, ExecutionContext.class, AtomicLong.class,
                    CoordinateTrie.class, ProcessExecutionException.class, List.class);

    private final EngineSpec engineSpec;
    private final ProcessCompiler compiler;

    private final AtomicLong processCounter = new AtomicLong(0);

    @Override
    public Process buildProcess(final ProcessConfig processConfig)
            throws ProcessConstructionException {
        final ClassFileData classFileData = new ClassFileData(processConfig);
        final String className = classFileData.getClassName();
        final String code = classFileData.getContents();
        final Object[] args = classFileData.getInstanceVariables();
        return compiler.compileAndInstantiate(className, code, args);
    }

    public interface SourceSegment {
        String getContents();
    }

    private class ClassFileData {

        private final Map<Class<?>, Pair<String, String>> toImport = new HashMap<>();
        private final Map<Object, String> instanceVars = new LinkedHashMap<>();
        private final CoordinateTrie<ExecutableInnerClassData> executableCoordinateTrie =
                new CoordinateTrie<>();

        private final boolean allowConcurrency;

        private final long processId;
        @Getter
        private final String contents;

        private ClassFileData(final ProcessConfig config) {
            this.allowConcurrency = config.isAllowConcurrency();
            this.processId = processCounter.getAndIncrement();

            DEFAULT_IMPORTS.forEach(this::ensureImport);

            final int[] rootCoordinates = new int[0];
            final BlockConfig rootBlock = config.getRootBlock();
            final int[][] rootDependencies = new int[0][];
            constructInnerClass(rootCoordinates, rootBlock, rootDependencies);
            this.contents = generateContents();
        }

        public String ensureInstanceVar(final Object object) {
            ensureImport(object.getClass());
            return instanceVars.computeIfAbsent(object, obj -> "var" + instanceVars.size());
        }

        public String ensureImport(final Class<?> classToImport) {
            return toImport.computeIfAbsent(classToImport, c -> {
                final List<String> nestedSegmentNames = new ArrayList<>();
                Class<?> pointer = c;
                final Class<?> root;
                while (true) {
                    nestedSegmentNames.add(0, pointer.getSimpleName());
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
            return CLASS_FILE_TPL.formatted(formatPackageName(), formatImports(),
                    formatFieldsAndConstructor(), processId, formatInnerClasses());
        }

        private void constructInnerClass(final int[] coordinates, final ExecutableConfig config,
                                         final int[][] dependencyCoordinates) {
            final ExecutableInnerClassData innerClass =
                    new ExecutableInnerClassData(this, config, coordinates, dependencyCoordinates);
            executableCoordinateTrie.put(coordinates, innerClass);

            // Recursively construct any child executable classes nested in control statements
            if (config instanceof BlockConfig blockConfig) {
                final List<ExecutableConfig> executables = blockConfig.getExecutables();
                for (int childIndex = 0; childIndex < executables.size(); childIndex++) {
                    final int[] childCoordinates = CoordinateUtils.getNthChild(coordinates, childIndex);
                    final ExecutableConfig child = executables.get(childIndex);
                    final int[][] childDependencyCoordinates;
                    if (allowConcurrency || childIndex == 0) {
                        childDependencyCoordinates = new int[0][];
                    } else {
                        childDependencyCoordinates =
                                new int[][] {CoordinateUtils.getAncestor(childCoordinates)};
                    }
                    constructInnerClass(childCoordinates, child, childDependencyCoordinates);
                }
            } else if (config instanceof ControlStatementConfig controlConfig) {
                for (int blockIndex = 0; blockIndex < controlConfig.getBlocks().size(); blockIndex++) {
                    final int[] blockCoordinates = CoordinateUtils.getNthChild(coordinates, blockIndex);
                    final BlockConfig block = controlConfig.getBlocks().get(blockIndex);
                    final int[][] blockDependencyCoordinates = new int[0][]; // control blocks are always independent
                    constructInnerClass(blockCoordinates, block, blockDependencyCoordinates);
                }
            }
        }

        private String formatPackageName() {
            return PACKAGE_TPL.formatted("process_" + processId);
        }

        private String formatImports() {
            return toImport.values().stream().map(Pair::getLeft).sorted().map("import %s;"::formatted)
                    .collect(Collectors.joining("\n"));
        }

        private String formatFieldsAndConstructor() {
            final String fieldDeclarations = instanceVars.entrySet().stream().map(e -> {
                final Class<?> type = e.getKey().getClass();
                final String typeRef = toImport.get(type).getRight();
                final String instanceVarName = e.getValue();
                return "\tfinal %s %s;".formatted(typeRef, instanceVarName);
            }).collect(Collectors.joining("\n"));
            final String constructorArgs = instanceVars.entrySet().stream().map(e -> {
                final Class<?> type = e.getKey().getClass();
                final String typeRef = toImport.get(type).getRight();
                final String instanceVarName = e.getValue();
                return "final %s %s".formatted(typeRef, instanceVarName);
            }).collect(Collectors.joining(", "));
            final String fieldInitializations = instanceVars.values().stream()
                    .map(instanceVarName -> "\t\tthis.%s = %s;".formatted(instanceVarName, instanceVarName))
                    .collect(Collectors.joining("\n"));
            final String trieLoading =
                    executableCoordinateTrie.values().stream().map(innerClass -> {
                        final int[] coordinates = innerClass.getCoordinates();
                        final String varName =
                                "exec" + CoordinateUtils.formatCoordinatesAsVariableFragment(coordinates);
                        final String className = innerClass.getClassName();
                        return """
                \t\tfinal Action %s = new %s();
                \t\ttrie.put(%s.getCoordinates(), %s);
                """.formatted(varName, className, varName, varName);
                    }).collect(Collectors.joining("\n"));

            return PROCESS_CONSTRUCTOR_TPL.formatted(fieldDeclarations, constructorArgs,
                    fieldInitializations, trieLoading);
        }

        private String formatInnerClasses() {
            return executableCoordinateTrie.values().stream()
                    .map(ExecutableInnerClassData::getContents).collect(Collectors.joining("\n\n"));
        }

        public Object[] getInstanceVariables() {
            return instanceVars.keySet().toArray(new Object[0]);
        }
    }

    public class ExecutableInnerClassData implements SourceSegment {


        @Getter
        private final ClassFileData containingClass;
        private final ExecutableConfig config;
        @Getter
        private final int[] coordinates;
        @Getter
        private final List<int[]> dependencyCoordinates = new ArrayList<>();

        private final String contents;

        private ExecutableInnerClassData(final ClassFileData containingClass,
                                         final ExecutableConfig config, final int[] coordinates,
                                         final int[]... dependencyCoordinates) {
            this.containingClass = containingClass;
            this.config = config;
            this.coordinates = coordinates;
            this.dependencyCoordinates.addAll(Arrays.asList(dependencyCoordinates));
            this.contents = generateContents();
        }

        @Override
        public String getContents() {
            return ACTION_CLASS_TEMPLATE.formatted(getClassName(),
                    CoordinateUtils.formatCoordinatesAsArrayInitializer(coordinates),
                    formatDependencies(), contents,
                    escapeSource(contents));
        }

        private String getClassName() {
            return "Executable"
                    + Arrays.stream(coordinates).mapToObj(Integer::toString).collect(Collectors.joining("_"));
        }

        private String formatDependencies() {
            return dependencyCoordinates.stream()
                    .map(CoordinateUtils::formatCoordinatesAsArrayInitializer)
                    .collect(Collectors.joining(", "));
        }

        private String generateContents() {
            final StringBuilder builder = new StringBuilder();
            if (config instanceof ActionConfig actionConfig) {
                final ActionSpec actionSpec = engineSpec.getActions().get(actionConfig.getName());
                final Object provider = actionSpec.getProvider();
                final String providerName = containingClass.ensureInstanceVar(provider);
                final Method method = actionSpec.getMethod();
                final Class<?> outputType = actionSpec.getOutputType();
                if (!Void.class.equals(outputType)) {
                    builder.append("return ");
                }
                final String args = actionSpec.getInputs().stream().map(input -> {
                    final String name = input.getName();
                    final Class<?> type = input.getType();
                    final List<ExpressionConfig> expressionConfigs = actionConfig.getInputs().get(name);
                    if (input.isMulti()) {
                        return new ArrayExpressionData(ExecutableInnerClassData.this, expressionConfigs,
                                type);
                    } else {
                        return mapExpression(ExecutableInnerClassData.this, expressionConfigs.get(0));
                    }
                }).map(ExpressionData::getContents).collect(Collectors.joining(", "));
                builder.append(providerName).append('.').append(method.getName()).append('(').append(args)
                        .append(")");
                if (Void.class.equals(outputType)) {
                    builder.append(";\n\t\t\treturn null");
                }
            } else if (config instanceof BlockConfig) {
                builder.append("context.enqueue(trie.listChildValues(")
                        .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(coordinates))
                        .append(", 1));\n");
                builder.append("\t\t\treturn null");
            } else if (config instanceof ConditionalConfig conditionalConfig) {
                final ExpressionConfig condition = conditionalConfig.getCondition();
                final ExpressionData conditionalExpression = mapExpression(this, condition);
                final int[] thenCoordinates = CoordinateUtils.getNthChild(coordinates, 0);
                final int[] elseCoordinates = CoordinateUtils.getNthChild(coordinates, 1);
                builder.append("if (").append(conditionalExpression.getContents()).append(") {\n")
                        .append("\t\t\t\tcontext.enqueue(trie.get(")
                        .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(thenCoordinates))
                        .append(");\n").append("\t\t\t} else {\n").append("\t\t\t\tcontext.enqueue(trie.get(")
                        .append(");\n")
                        .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(elseCoordinates))
                        .append("\t\t\t}\n");
                builder.append(";\n\t\t\treturn null");
            }

            return builder.toString();
        }

    }

    @Getter
    private static abstract class ExpressionData implements SourceSegment {

        private final ExecutableInnerClassData containingClass;

        private ExpressionData(final ExecutableInnerClassData containingClass) {
            this.containingClass = containingClass;
        }

        public ClassFileData getSourceFile() {
            return containingClass.getContainingClass();
        }
    }

    private class FunctionExpressionData extends ExpressionData {

        private final FunctionConfig config;
        private final FunctionSpec spec;

        private final List<ExpressionData> args;

        @Getter
        private final String contents;

        public FunctionExpressionData(final ExecutableInnerClassData containingClass,
                                      final FunctionConfig config) {
            super(containingClass);
            this.config = config;
            this.spec = engineSpec.getFunctions().get(config.getName());
            this.args =
                    this.spec.getInputs().stream().map(this::getArgument).collect(Collectors.toList());
            this.contents = generateContents();
        }

        public String generateContents() {
            final Object provider = spec.getProvider();
            final String providerVar = this.getSourceFile().ensureInstanceVar(provider);
            final String functionName = spec.getMethod().getName();
            return providerVar + "." + functionName + "("
                    + args.stream().map(ExpressionData::getContents).collect(Collectors.joining(", ")) + ")";
        }

        public ExpressionData getArgument(final InputSpec inputSpec) {
            final String name = inputSpec.getName();
            final Class<?> type = inputSpec.getType();
            final boolean multi = inputSpec.isMulti();
            final List<ExpressionConfig> expressionConfigs = config.getArguments().get(name);
            if (multi) {
                return new ArrayExpressionData(getContainingClass(), expressionConfigs, type);
            } else {
                final ExpressionConfig expressionConfig = expressionConfigs.get(0);
                return mapExpression(getContainingClass(), expressionConfig);
            }
        }
    }

    private class ValueExpressionData extends ExpressionData {

        private final ValueConfig config;
        private final TypeSpec typeSpec;
        @Getter
        private final String contents;

        private ValueExpressionData(final ExecutableInnerClassData containingClass,
                                    final ValueConfig config) {
            super(containingClass);
            this.config = config;
            this.typeSpec = engineSpec.getTypes().get(config.getTypeId());
            this.contents = generateContents();
        }

        public String generateContents() {
            final Class<?> type = typeSpec.getRuntimeClass();
            final String value = config.getValue();
            if (type.equals(int.class) || type.equals(Integer.class) || type.equals(float.class)
                    || type.equals(Float.class) || type.equals(boolean.class) || type.equals(Boolean.class)) {
                // code representation is equivalent to string representation
                return value;
            } else if (type.equals(String.class)) {
                // strings require quotes
                return "\"" + value + "\"";
            } else if (type.equals(long.class) || type == Long.class) {
                // longs require "L" suffix
                return value + "L";
            } else if (type.equals(double.class) || type == Double.class) {
                // doubles require "D" suffix
                return value + "D";
            }
            throw new IllegalStateException("Type cannot be represented as value: " + typeSpec);
        }
    }

    private class VariableReferenceData extends ExpressionData {

        private final ReferenceConfig config;
        @Getter
        private final String contents;

        private VariableReferenceData(final ExecutableInnerClassData containingClass,
                                      final ReferenceConfig config) {
            super(containingClass);
            this.config = config;
            this.contents = generateContents();
        }

        public String generateContents() {
            final StringBuilder writer = new StringBuilder();

            for (final ReferenceConfig.Reference reference : config.getReferences()) {
                final int[] coordinates = reference.getCoordinates();
                final String[] path = reference.getPath();
                final boolean nested = path != null && path.length > 0;
                if (nested) {
                    writer.append("context.isNestedVariableSet(")
                            .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(coordinates));
                    for (final String p : path) {
                        writer.append(", \"").append(p).append("\"");
                    }
                    writer.append(")");
                } else {
                    writer.append("context.isVariableSet(")
                            .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(coordinates)).append(")");
                }
                writer.append(" ? ");
                if (nested) {
                    writer.append("context.getNestedVariable(")
                            .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(coordinates));
                    for (final String p : path) {
                        writer.append(", \"").append(p).append("\"");
                    }
                    writer.append(")");
                } else {
                    writer.append("context.getVariable(")
                            .append(CoordinateUtils.formatCoordinatesAsArrayInitializer(coordinates)).append(")");
                }
                writer.append(" : ");
            }
            if (config.getFallback() != null) {
                writer.append(mapExpression(this.getContainingClass(), config.getFallback()).getContents());
            } else {
                writer.append("null");
            }
            writer.append(" ");
            return writer.toString();
        }
    }
    private class ArrayExpressionData extends ExpressionData {

        private final Class<?> type;
        private final List<ExpressionData> args;
        @Getter
        private final String contents;

        private ArrayExpressionData(final ExecutableInnerClassData containingClass,
                                    final List<ExpressionConfig> configs, final Class<?> type) {
            super(containingClass);
            this.type = type;
            args = configs.stream().map(config -> mapExpression(containingClass, config))
                    .collect(Collectors.toList());
            getSourceFile().ensureImport(type);
            this.contents = generateContents();
        }

        public String generateContents() {
            final StringBuilder builder = new StringBuilder();
            final String typeName = getSourceFile().ensureImport(type);

            // output all expressions as an array
            builder.append("new ").append(typeName).append("[]{")
                    .append(args.stream().map(ExpressionData::getContents).collect(Collectors.joining(", ")))
                    .append("}");
            return builder.toString();
        }
    }


    private ExpressionData mapExpression(final ExecutableInnerClassData containingClass,
                                         final ExpressionConfig config) {
        if (config instanceof FunctionConfig functionConfig) {
            return new FunctionExpressionData(containingClass, functionConfig);
        } else if (config instanceof ValueConfig valueConfig) {
            return new ValueExpressionData(containingClass, valueConfig);
        } else if (config instanceof ReferenceConfig referenceConfig) {
            return new VariableReferenceData(containingClass, referenceConfig);
        }
        throw new IllegalStateException("Unknown expression config type: " + config.getClass());
    }

    /**
     * Very simple escape logic. Only intended to expose logic as toString(), not intended to be unescaped or escaped multiple times
     * @param source source code
     * @return source code that can be printed as a Java string
     */
    private static String escapeSource(final String source) {
        return source.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n");
    }
}
