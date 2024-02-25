package io.logicforge.core.engine.compile;

import io.logicforge.core.common.Coordinates;
import io.logicforge.core.common.Pair;
import io.logicforge.core.common.CoordinateTrie;
import io.logicforge.core.common.TypedArgument;
import io.logicforge.core.engine.Action;
import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.core.engine.Process;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.engine.impl.DefaultExecutionContext;
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
import io.logicforge.core.model.specification.ProcessSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import static io.logicforge.core.common.Coordinates.ROOT;

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
     * <li>The process interface class name</li>
     * <li>A string containing a formatted list of fields and a constructor injecting those fields</li>
     * <li>The signature for the process executor method</li>
     * <li>Method calls for loading the process arguments into the "args" map</li>
     * <li>The EngineSpec instance var name and queue var name (comma-separated)</li>
     * <li>the function's return statement</li>
     * <li>The Process's unique ID string</li>
     * <li>A formatted list of the Process's executables, defined as inner classes</li>
     * <li>The return statement, defined as an inner class</li>
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
      \t\tfinal Action rootAction = trie.get(Coordinates.ROOT);
      \t\tcontext.enqueue(rootAction);
      \t\t%s
      \t}

      \tpublic String getProcessId() {
      \t\treturn "%s";
      \t}

      \tpublic long getExecutionCount() {
      \t\treturn executionCount.get();
      \t}
      %s
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
      
                \t\tprivate final Coordinates coordinates = %s;
                \t\tprivate final List<Coordinates> dependencyCoordinates = List.of(%s);
      
                \t\tpublic Object execute(final ExecutionContext context) throws ProcessExecutionException {
      
                \t\t\t%s;
                \t\t}
                          
                \t\tpublic Coordinates getCoordinates() {
                \t\t\treturn coordinates;
                \t\t}
                          
                \t\tpublic List<Coordinates> getDependencyCoordinates() {
                \t\t\treturn dependencyCoordinates;
                \t\t}
      
                \t\tpublic String toString() {
                \t\t\treturn "%s";
                \t\t}
                \t}""";

    /**
     * A template representing an action that calculates the processes return value;
     *
     * <ol>
     * <li>The execution logic</li>
     * <li>The execution logic (to be outputted as a string for debugging)</li>
     * </ol>
     */
    private static final String RETURN_ACTION_CLASS_TEMPLATE =
            """
                
                \tprivate class ReturnAction implements Action {
      
                \t\tprivate final Coordinates coordinates = Coordinates.from(List.of(-1));
                \t\tprivate final List<Coordinates> dependencyCoordinates = List.of();
      
                \t\tpublic Object execute(final ExecutionContext context) throws ProcessExecutionException {
                \t\t\treturn %s;
                \t\t}
                          
                \t\tpublic Coordinates getCoordinates() {
                \t\t\treturn coordinates;
                \t\t}
                          
                \t\tpublic List<Coordinates> getDependencyCoordinates() {
                \t\t\treturn dependencyCoordinates;
                \t\t}
      
                \t\tpublic String toString() {
                \t\t\treturn "%s";
                \t\t}
                \t}""";

    private static final Set<Class<?>> DEFAULT_IMPORTS =
            Set.of(Action.class, ExecutionContext.class, DefaultExecutionContext.class, AtomicLong.class,
                    Coordinates.class, CoordinateTrie.class, ProcessExecutionException.class, List.class, Map.class,
                    HashMap.class);

    private final EngineSpec engineSpec;
    private final ProcessCompiler compiler;

    private final AtomicLong processCounter = new AtomicLong(0);

    @Override
    public <T extends Process> T buildProcess(final ProcessConfig<T> processConfig, final ExecutionQueue queue)
            throws ProcessConstructionException {
        final Class<T> functionalInterface = processConfig.getFunctionalInterface();
        final ClassFileData classFileData = new ClassFileData(processConfig, queue, functionalInterface);
        final String className = classFileData.getClassName();
        final String code = classFileData.getContents();
        final List<TypedArgument> args = classFileData.getInstanceVariables();
        return compiler.compileAndInstantiate(className, code, args, functionalInterface);
    }

    public interface SourceSegment {
        String getContents();
    }

    private class ClassFileData {

        private final Map<Class<?>, Pair<String, String>> toImport = new HashMap<>();
        private final Map<Object, Pair<Class<?>, String>> instanceVars = new LinkedHashMap<>();
        private final CoordinateTrie<ExecutableInnerClassData> executableCoordinateTrie =
                new CoordinateTrie<>();
        private final ProcessConfig config;
        private final long processId;
        private final ProcessSpec processSpec;
        private final String engineSpecVarName;
        private final String queueVarName;
        private final String processInterfaceName;
        @Getter
        private final String contents;

        private ClassFileData(final ProcessConfig config,
                              final ExecutionQueue queue, final Class<?> processInterfaceClass) throws ProcessConstructionException {

            this.config = config;
            this.processId = processCounter.getAndIncrement();
            this.engineSpecVarName = ensureInstanceVar(engineSpec);
            this.queueVarName = ensureInstanceVar(queue, ExecutionQueue.class);
            this.processSpec = engineSpec.getProcesses().values().stream()
                    .filter(spec -> spec.getMethod().getDeclaringClass().equals(processInterfaceClass))
                    .findFirst()
                    .orElseThrow(() -> new ProcessConstructionException(("Supplied process interface %s has not been " +
                            "registered").formatted(processInterfaceClass)));
            this.processInterfaceName = ensureImport(processSpec.getMethod().getDeclaringClass());

            DEFAULT_IMPORTS.forEach(this::ensureImport);

            final BlockConfig rootBlock = config.getRootBlock();
            final Set<Coordinates> rootDependencies = new HashSet<>();
            constructInnerClass(ROOT, rootBlock, rootDependencies);
            this.contents = generateContents();
        }

        public boolean isAllowConcurrency() {
            return config.isAllowConcurrency();
        }

        public String ensureInstanceVar(final Object object) {
            return ensureInstanceVar(object, object.getClass());
        }

        public String ensureInstanceVar(final Object object, final Class<?> type) {
            ensureImport(type);
            return instanceVars.computeIfAbsent(object, obj -> new Pair<>(type, "var" + instanceVars.size())).getRight();
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
            return CLASS_FILE_TPL.formatted(
                    formatPackageName(),
                    formatImports(),
                    processInterfaceName,
                    formatFieldsAndConstructor(),
                    formatMethodSignature(),
                    formatArgsLoadingLogic(),
                    "%s, %s".formatted(engineSpecVarName, queueVarName),
                    formatReturnStatement(),
                    processId, formatInnerClasses(),
                    formatReturnActionInnerClass());
        }

        private void constructInnerClass(final Coordinates coordinates, final ExecutableConfig config,
                                         final Set<Coordinates> dependencyCoordinates) {
            final ExecutableInnerClassData innerClass =
                    new ExecutableInnerClassData(this, config, coordinates, dependencyCoordinates);
            executableCoordinateTrie.put(coordinates, innerClass);

            // Recursively construct any child executable classes nested in control statements
            if (config instanceof BlockConfig blockConfig) {
                final List<ExecutableConfig> executables = blockConfig.getExecutables();
                for (int childIndex = 0; childIndex < executables.size(); childIndex++) {
                    final Coordinates childCoordinates = coordinates.getNthChild(childIndex);
                    final ExecutableConfig child = executables.get(childIndex);
                    final Set<Coordinates> childDependencyCoordinates = new HashSet<>();
                    if (!isAllowConcurrency() && childIndex != 0) {
                        childDependencyCoordinates.add(childCoordinates.getAncestor());
                    }
                    constructInnerClass(childCoordinates, child, childDependencyCoordinates);
                }
            } else if (config instanceof ControlStatementConfig controlConfig) {
                for (int blockIndex = 0; blockIndex < controlConfig.getBlocks().size(); blockIndex++) {
                    final Coordinates blockCoordinates = coordinates.getNthChild(blockIndex);
                    final BlockConfig block = controlConfig.getBlocks().get(blockIndex);
                    final Set<Coordinates> blockDependencyCoordinates = new HashSet<>(); // control blocks are always independent
                    constructInnerClass(blockCoordinates, block, blockDependencyCoordinates);
                }
            }
        }

        private String formatPackageName() {
            return PACKAGE_TPL.formatted("process_" + processId);
        }

        private String formatImports() {
            return toImport.values().stream().map(Pair::getLeft).sorted().distinct().map("import %s;"::formatted)
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
            final String fieldInitializations = instanceVars.values().stream()
                    .map(Pair::getRight)
                    .map(instanceVarName -> "\t\tthis.%s = %s;".formatted(instanceVarName, instanceVarName))
                    .collect(Collectors.joining("\n"));
            final String trieLoading =
                    executableCoordinateTrie.values().stream().map(innerClass -> {
                        final Coordinates coordinates = innerClass.getCoordinates();
                        final String varName =
                                "exec" + coordinatesAsVariableFragment(coordinates);
                        final String className = innerClass.getClassName();
                        return """
                \t\tfinal Action %s = new %s();
                \t\ttrie.put(%s.getCoordinates(), %s);
                """.formatted(varName, className, varName, varName);
                    }).collect(Collectors.joining("\n"));

            return PROCESS_CONSTRUCTOR_TPL.formatted(fieldDeclarations, constructorArgs,
                    fieldInitializations, trieLoading);
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
                builder.append("final ")
                        .append(typeName)
                        .append(multi ? "[] " : " ")
                        .append(name);
            }
            builder.append(")");
            return builder.toString();
        }

        private String formatArgsLoadingLogic() {
            final StringBuilder builder = new StringBuilder();
            for (final InputSpec input : processSpec.getInputs()) {
                final String name = input.getName();
                builder.append("\t\targs.put(\"")
                        .append(name)
                        .append("\", ")
                        .append(name)
                        .append(");\n");
            }
            return builder.toString();
        }

        private String formatReturnStatement() {
            final Class<?> type = processSpec.getOutputType();
            if (Void.class.equals(type)) {
                return "context.await(new ReturnAction(), Void.class);";
            } else {
                final String typeRef = ensureImport(type);
                return "return context.await(new ReturnAction(), %s.class);".formatted(typeRef);
            }
        }

        private String formatInnerClasses() {
            return executableCoordinateTrie.values().stream()
                    .map(ExecutableInnerClassData::getContents).collect(Collectors.joining("\n\n"));
        }

        private String formatReturnActionInnerClass() {
            final String implementation;
            final Class<?> type = processSpec.getOutputType();
            if (config.getReturnStatement() != null && !Void.class.equals(type)) {
                final ExpressionData expressionData = mapExpression(this, config.getReturnStatement(), type);
                implementation = expressionData.getContents();
            } else {
                implementation = "null";
            }
            return RETURN_ACTION_CLASS_TEMPLATE.formatted(implementation, escapeSource(implementation));
        }

        public List<TypedArgument> getInstanceVariables() {
            return instanceVars.entrySet().stream()
                    .map(e -> TypedArgument.from(e.getValue().getLeft(), e.getKey()))
                    .collect(Collectors.toList());
        }
    }

    public class ExecutableInnerClassData implements SourceSegment {


        @Getter
        private final ClassFileData containingClass;
        private final ExecutableConfig config;
        @Getter
        private final Coordinates coordinates;
        @Getter
        private final Set<Coordinates> dependencyCoordinates = new HashSet<>();

        private final String contents;

        private ExecutableInnerClassData(final ClassFileData containingClass,
                                         final ExecutableConfig config, final Coordinates coordinates,
                                         final Set<Coordinates> dependencyCoordinates) {
            this.containingClass = containingClass;
            this.config = config;
            this.coordinates = coordinates;
            this.dependencyCoordinates.addAll(dependencyCoordinates);
            this.contents = generateContents();
        }

        @Override
        public String getContents() {
            return ACTION_CLASS_TEMPLATE.formatted(getClassName(),
                    coordinatesAsCodeInitializer(coordinates),
                    formatDependencies(), contents,
                    escapeSource(contents));
        }

        private String getClassName() {
            return "Executable"
                    + coordinatesAsVariableFragment(coordinates);
        }

        private String formatDependencies() {
            return dependencyCoordinates.stream()
                    .map(CompilationProcessBuilder::coordinatesAsCodeInitializer)
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
                        return new ArrayExpressionData(this.containingClass, expressionConfigs,
                                type);
                    } else {
                        return mapExpression(this.containingClass, expressionConfigs.getFirst(), type);
                    }
                }).map(ExpressionData::getContents).collect(Collectors.joining(", "));
                builder.append(providerName).append('.').append(method.getName()).append('(').append(args)
                        .append(")");
                if (Void.class.equals(outputType)) {
                    builder.append(";\n\t\t\treturn null");
                }
            } else if (config instanceof BlockConfig) {
                builder.append("context.enqueue(trie.listChildren(")
                        .append(coordinatesAsCodeInitializer(coordinates))
                        .append("));\n");
                builder.append("\t\t\treturn null");
            } else if (config instanceof ConditionalConfig conditionalConfig) {
                final ExpressionConfig condition = conditionalConfig.getCondition();
                final ExpressionData conditionalExpression = mapExpression(this.containingClass, condition, boolean.class);
                final Coordinates thenCoordinates = coordinates.getNthChild(0);
                final Coordinates elseCoordinates = coordinates.getNthChild(1);
                builder.append("if (").append(conditionalExpression.getContents()).append(") {\n")
                        .append("\t\t\t\tcontext.enqueue(trie.get(")
                        .append(coordinatesAsCodeInitializer(thenCoordinates))
                        .append(");\n").append("\t\t\t} else {\n").append("\t\t\t\tcontext.enqueue(trie.get(")
                        .append(");\n")
                        .append(coordinatesAsCodeInitializer(elseCoordinates))
                        .append("\t\t\t}\n");
                builder.append(";\n\t\t\treturn null");
            }

            return builder.toString();
        }

    }

    @Getter
    private static abstract class ExpressionData implements SourceSegment {

        private final ClassFileData sourceFile;

        private ExpressionData(final ClassFileData sourceFile) {
            this.sourceFile = sourceFile;
        }
    }

    private class FunctionExpressionData extends ExpressionData {

        private final FunctionConfig config;
        private final Class<?> type;
        private final FunctionSpec spec;

        private final List<ExpressionData> args;

        @Getter
        private final String contents;

        public FunctionExpressionData(final ClassFileData sourceFile,
                                      final FunctionConfig config, Class<?> type) {
            super(sourceFile);
            this.config = config;
            this.spec = engineSpec.getFunctions().get(config.getName());
            this.type = type;
            this.args =
                    this.spec.getInputs().stream().map(this::getArgument).collect(Collectors.toList());
            this.contents = generateContents();
        }

        public String generateContents() {
            final Object provider = spec.getProvider();
            final String providerVar = this.getSourceFile().ensureInstanceVar(provider);
            final String functionName = spec.getMethod().getName();
            final String implementation = providerVar + "." + functionName + "("
                    + args.stream().map(ExpressionData::getContents).collect(Collectors.joining(", ")) + ")";
            if (!type.equals(spec.getOutputType())) {
                return "context.convert(%s, %s.class)".formatted(implementation, getSourceFile().ensureImport(type));
            } else {
                return implementation;
            }
        }

        public ExpressionData getArgument(final InputSpec inputSpec) {
            final String name = inputSpec.getName();
            final Class<?> type = inputSpec.getType();
            final boolean multi = inputSpec.isMulti();
            final List<ExpressionConfig> expressionConfigs = config.getArguments().get(name);
            if (multi) {
                return new ArrayExpressionData(getSourceFile(), expressionConfigs, type);
            } else {
                final ExpressionConfig expressionConfig = expressionConfigs.getFirst();
                return mapExpression(getSourceFile(), expressionConfig, type);
            }
        }
    }

    private class ValueExpressionData extends ExpressionData {

        private final ValueConfig config;
        private final Class<?> type;
        @Getter
        private final String contents;

        private ValueExpressionData(final ClassFileData sourceFile,
                                    final ValueConfig config, final Class<?> type) {
            super(sourceFile);
            this.config = config;
            this.type = type;
            this.contents = generateContents();
        }

        public String generateContents() {
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
            throw new IllegalStateException("Type cannot be represented as value: " + type);
        }
    }

    private class VariableReferenceData extends ExpressionData {

        private final ReferenceConfig config;
        private final Class<?> type;
        @Getter
        private final String contents;

        private VariableReferenceData(final ClassFileData sourceFile,
                                      final ReferenceConfig config, final Class<?> type) {
            super(sourceFile);
            this.config = config;
            this.type = type;
            this.contents = generateContents();
        }

        public String generateContents() {
            final StringBuilder writer = new StringBuilder();
            final String typeName = getSourceFile().ensureImport(type);

            for (final ReferenceConfig.Reference reference : config.getReferences()) {
                final Coordinates coordinates = Coordinates.from(reference.getCoordinateList());
                final List<String> path = reference.getPath();
                final boolean nested = path != null && !path.isEmpty();
                if (nested) {
                    writer.append("context.isNestedVariableSet(")
                            .append(coordinatesAsCodeInitializer(coordinates)).append(", ")
                            .append(typeName)
                            .append(".class");
                    for (final String p : path) {
                        writer.append(", \"").append(p).append("\"");
                    }
                    writer.append(")");
                } else {
                    writer.append("context.isVariableSet(")
                            .append(coordinatesAsCodeInitializer(coordinates))
                            .append(", ")
                            .append(typeName)
                            .append(".class)");
                }
                writer.append(" ? ");
                if (nested) {
                    writer.append("context.getNestedVariable(")
                            .append(coordinatesAsCodeInitializer(coordinates))
                            .append(", ")
                            .append(typeName)
                            .append(".class");
                    for (final String p : path) {
                        writer.append(", \"").append(p).append("\"");
                    }
                    writer.append(")");
                } else {
                    writer.append("context.getVariable(")
                            .append(coordinatesAsCodeInitializer(coordinates))
                            .append(", ")
                            .append(typeName)
                            .append(".class")
                            .append(")");
                }
                writer.append(" : ");
            }
            if (config.getFallback() != null) {
                writer.append(mapExpression(getSourceFile(), config.getFallback(), type).getContents());
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

        private ArrayExpressionData(final ClassFileData sourceFile,
                                    final List<ExpressionConfig> configs, final Class<?> type) {
            super(sourceFile);
            this.type = type;
            args = configs.stream().map(config -> mapExpression(sourceFile, config, type))
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


    private ExpressionData mapExpression(final ClassFileData sourceFile,
                                         final ExpressionConfig config, final Class<?> type) {
        if (config instanceof FunctionConfig functionConfig) {
            return new FunctionExpressionData(sourceFile, functionConfig, type);
        } else if (config instanceof ValueConfig valueConfig) {
            return new ValueExpressionData(sourceFile, valueConfig, type);
        } else if (config instanceof ReferenceConfig referenceConfig) {
            return new VariableReferenceData(sourceFile, referenceConfig, type);
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

    /**
     * Formats coordinates as a string that can be inserted into Java source code that will evaluate as an identical
     * instance of Coordinates at runtime
     */
    private static String coordinatesAsCodeInitializer(final Coordinates coordinates) {
        return "Coordinates.from(%s)".formatted(coordinates.asFormattedString(","));
    }

    /**
     * Formats coordinates as a underscore-separated string, acceptable for use in variable and class names in Java source.
     */
    private static String coordinatesAsVariableFragment(final Coordinates coordinates) {
        return coordinates.asFormattedString("_");
    }


}
