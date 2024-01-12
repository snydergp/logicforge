package io.logicforge.core.engine.compile;

import io.logicforge.core.annotations.Injectable;
import io.logicforge.core.common.OneOf;
import io.logicforge.core.common.Pair;
import io.logicforge.core.engine.Action;
import io.logicforge.core.engine.ActionExecutor;
import io.logicforge.core.engine.ChildActionsImpl;
import io.logicforge.core.engine.InjectableFactory;
import io.logicforge.core.engine.Process;
import io.logicforge.core.engine.ProcessBuilder;
import io.logicforge.core.exception.ProcessConstructionException;
import io.logicforge.core.exception.ProcessExecutionException;
import io.logicforge.core.injectable.ChildActions;
import io.logicforge.core.injectable.ExecutionContext;
import io.logicforge.core.injectable.ModifiableExecutionContext;
import io.logicforge.core.model.configuration.ActionConfig;
import io.logicforge.core.model.configuration.FunctionConfig;
import io.logicforge.core.model.configuration.InputConfig;
import io.logicforge.core.model.configuration.ProcessConfig;
import io.logicforge.core.model.configuration.ValueConfig;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.ComputedParameterSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.MethodSpec;
import io.logicforge.core.model.specification.ParameterSpec;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import javax.tools.DiagnosticCollector;
import javax.tools.FileObject;
import javax.tools.ForwardingJavaFileManager;
import javax.tools.JavaCompiler;
import javax.tools.JavaCompiler.CompilationTask;
import javax.tools.JavaFileManager;
import javax.tools.JavaFileObject;
import javax.tools.JavaFileObject.Kind;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.security.SecureClassLoader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class CompilationProcessBuilder implements ProcessBuilder {

  private static final String PROCESS_CLASS_FILE_TPL =
      """
          package %s;

          %s

          public class %s implements Process {

          \tprivate final AtomicLong executionCount = new AtomicLong(0L);

          %s

          \tpublic void execute(final ModifiableExecutionContext context, final ActionExecutor executor) {

          \t\tfinal long executionNumber = executionCount.getAndIncrement();
          \t\tfinal ChildActions rootActions = new ChildActionsImpl(executor, %s);
          \t\trootActions.executeSync(context);
          \t}

          \tpublic String getProcessId() {
            return "%s";
          \t}

          \tpublic long getExecutionCount() {
            return executionCount.get();
          \t}

          %s

          }
          """;

  private static final String PACKAGE_TPL = "io.metalmind.generated.action.%s";

  private static final Set<Class<?>> DEFAULT_INCLUDES =
      Set.of(Process.class, Action.class, ActionExecutor.class, ModifiableExecutionContext.class,
          ExecutionContext.class, ChildActions.class, ChildActionsImpl.class, AtomicLong.class,
          ProcessExecutionException.class);

  private static final String ACTION_INNER_CLASS_TPL =
      """
          \tprivate class %s implements Action {

          \t\tpublic void execute(final ModifiableExecutionContext context) throws ProcessExecutionException {
          \t\t\tfinal ExecutionContext readonlyContext = context.getReadonlyView();

          \t\t\t%s;
          \t\t}

          \t\tpublic String getName() {
          \t\t\treturn "%s";
          \t\t}

          \t\tpublic String getProcessId() {
          \t\t\treturn "%s";
          \t\t}

          \t\tpublic String getPath() {
          \t\t\treturn "%s";
          \t\t}

          \t\tpublic int getIndex() {
          \t\t\treturn %s;
          \t\t}

          \t\tpublic String toString() {
          \t\t\treturn "%s";
          \t\t}
          \t}

          """;

  private final EngineSpec engineSpec;

  private final AtomicLong processCounter = new AtomicLong(0);
  private final Map<Class<? extends InjectableFactory>, InjectableFactory> factoryCache =
      new HashMap<>();

  public Process buildProcess(final ProcessConfig processConfig)
      throws ProcessConstructionException {
    final long index = processCounter.getAndIncrement();
    final String processId = Long.toString(index);

    final ProcessClassInfo processClassInfo = new ProcessClassInfo(processId, processConfig, index);
    final String code = processClassInfo.getFileContents();
    final InMemorySource source =
        new InMemorySource(processClassInfo.getFullyQualifiedName(), code);

    final JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    final InMemoryFileManager fileManager =
        new InMemoryFileManager(compiler.getStandardFileManager(null, null, null));
    final DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();

    final StringWriter javacLog = new StringWriter();
    final List<InMemorySource> toCompile = List.of(source);
    final CompilationTask task =
        compiler.getTask(javacLog, fileManager, diagnostics, null, null, toCompile);

    boolean success = task.call();
    // TODO log diagnostic info

    if (success) {
      return loadClassInstance(fileManager, processClassInfo);
    } else {
      throw new ProcessConstructionException("Error compiling process actions: " + diagnostics
          .getDiagnostics().stream().map(diagnostic -> diagnostic.getMessage(Locale.ENGLISH))
          .collect(Collectors.joining("\n")));
    }
  }

  private Process loadClassInstance(final InMemoryFileManager fileManager,
      final ProcessClassInfo classInfo) throws ProcessConstructionException {

    try {
      final Class<?> loaded =
          fileManager.getClassLoader(null).loadClass(classInfo.getFullyQualifiedName());
      if (!Process.class.isAssignableFrom(loaded)) {
        throw new ProcessConstructionException("Compiled process does not represent expected type");
      }
      final Class<? extends Process> actionClass = (Class<? extends Process>) loaded;
      final Constructor<? extends Process> constructor =
          actionClass.getConstructor(classInfo.getConstructorParameterTypes());
      return constructor.newInstance(classInfo.getConstructorArgs());
    } catch (ClassNotFoundException | NoSuchMethodException | InstantiationException
        | IllegalAccessException | InvocationTargetException e) {
      throw new ProcessConstructionException("Error loading generated process class", e);
    }
  }

  private InjectableFactory getInjectableFactory(
      final Class<? extends InjectableFactory> factoryClass) {
    InjectableFactory factory = factoryCache.get(factoryClass);
    if (factory == null) {
      try {
        final Constructor<? extends InjectableFactory> constructor = factoryClass.getConstructor();
        factory = constructor.newInstance();
        factoryCache.put(factoryClass, factory);
      } catch (NoSuchMethodException | IllegalAccessException | InvocationTargetException
          | InstantiationException e) {
        throw new RuntimeException(
            "Error instantiating injectable factory for class: " + factoryClass, e);
      }
    }
    return factory;
  }

  private ActionSpec loadAction(final String name) throws ProcessConstructionException {
    final ActionSpec actionSpec = engineSpec.getActions().get(name);
    if (actionSpec == null) {
      throw new ProcessConstructionException("Process references missing action: " + name);
    }
    return actionSpec;
  }

  private FunctionSpec loadFunction(final String name) throws ProcessConstructionException {
    final FunctionSpec functionSpec = engineSpec.getFunctions().get(name);
    if (functionSpec == null) {
      throw new ProcessConstructionException("Process references missing function: " + name);
    }
    return functionSpec;
  }

  private static class InMemorySource extends SimpleJavaFileObject {

    @Getter
    private String name;
    private String code;

    private final ByteArrayOutputStream compiled = new ByteArrayOutputStream();

    public InMemorySource(final String className, final String code) {
      super(URI.create("string:///" + className.replace('.', '/') + Kind.SOURCE.extension),
          Kind.SOURCE);
      this.name = className;
      this.code = code;
    }

    public InMemorySource(final String className, final Kind kind) {
      super(URI.create("string:///" + className.replace('.', '/') + kind.extension), kind);
    }

    @Override
    public CharSequence getCharContent(boolean ignoreEncodingErrors) {
      return code;
    }

    @Override
    public OutputStream openOutputStream() {
      return compiled;
    }

    public byte[] getCompiledBytes() {
      return compiled.toByteArray();
    }
  }

  public static class InMemoryFileManager extends ForwardingJavaFileManager<JavaFileManager> {
    private final HashMap<String, InMemorySource> classes = new HashMap<>();

    public InMemoryFileManager(final StandardJavaFileManager standardManager) {
      super(standardManager);
    }

    @Override
    public ClassLoader getClassLoader(final Location location) {
      return new SecureClassLoader() {
        @Override
        protected Class<?> findClass(final String className) throws ClassNotFoundException {
          if (classes.containsKey(className)) {
            byte[] classFile = classes.get(className).getCompiledBytes();
            Class<?> definedClass = super.defineClass(className, classFile, 0, classFile.length);
            resolveClass(definedClass);
            return definedClass;
          } else {
            throw new ClassNotFoundException();
          }
        }
      };
    }

    @Override
    public InMemorySource getJavaFileForOutput(Location location, String className, Kind kind,
        FileObject sibling) {
      if (classes.containsKey(className)) {
        return classes.get(className);
      } else {
        final InMemorySource inMemorySource = new InMemorySource(className, kind);
        classes.put(className, inMemorySource);
        return inMemorySource;
      }
    }
  }

  private class ProcessClassInfo {

    @Getter
    private final String processId;
    private final String packageName;
    private final String className;
    private final Set<Class<?>> imports = new HashSet<>(DEFAULT_INCLUDES);
    private final Map<Object, String> varNames = new LinkedHashMap<>();
    private final List<ActionClassContext> innerClasses = new ArrayList<>();
    private final Map<String, List<String>> childActionsToConstruct = new HashMap<>();
    private final String rootActionsVarName;

    private final AtomicInteger innerClassCount = new AtomicInteger(0);

    public ProcessClassInfo(final String processId, final ProcessConfig processConfig,
        final long index) throws ProcessConstructionException {

      this.processId = processId;
      this.packageName = String.format(PACKAGE_TPL, "pid_" + index);
      this.className = "Process" + index;

      this.rootActionsVarName = addChildActions(processConfig.getActions(), "root");
    }

    public String getFullyQualifiedName() {
      return packageName + "." + className;
    }

    public Class<?>[] getConstructorParameterTypes() {
      return varNames.keySet().stream().map(Object::getClass).toArray(size -> new Class<?>[size]);
    }

    public Object[] getConstructorArgs() {
      return varNames.keySet().toArray(Object[]::new);
    }

    /**
     * Ensures that an import is included for the provided class
     *
     * @param toImport the class to import
     * @return the unqualified name to use for the imported class
     */
    public String ensureImport(final Class<?> toImport) {
      imports.add(toImport.getEnclosingClass() == null ? toImport : toImport.getEnclosingClass());
      final String className = toImport.getName();
      final int finalDotIndex = className.lastIndexOf('.');
      final String simpleName =
          finalDotIndex >= 0 ? className.substring(finalDotIndex + 1) : className;
      return simpleName.replace('$', '.');
    }

    public String ensureInstanceVar(final Object var) {
      ensureImport(var.getClass());
      String varName = varNames.computeIfAbsent(var, k -> "var" + varNames.size());
      return varName;
    }

    /**
     * Adds a list of child actions. A ChildActions object representing the list will be added as an instance variable, and
     * the variable name to reference will be returned;
     *
     * @param config the actions
     * @param path the path of the actions
     * @return the name of the ChildActions instance variable
     * @throws ProcessConstructionException
     */
    public String addChildActions(final List<ActionConfig> config, final String path)
        throws ProcessConstructionException {

      final List<String> classNames = new ArrayList<>();

      for (int i = 0; i < config.size(); i++) {
        final ActionConfig actionConfig = config.get(i);
        final ActionClassContext innerClassWriter =
            new ActionClassContext(innerClassCount.getAndIncrement(), this, path, i, actionConfig);
        final String className = innerClassWriter.getClassName();
        classNames.add(className);
        innerClasses.add(innerClassWriter);
      }

      final String varName = "children" + childActionsToConstruct.size();
      childActionsToConstruct.put(varName, classNames);
      return varName;
    }

    public String getFileContents() throws ProcessConstructionException {

      final String innerClasses = prepareInnerClasses();

      return String.format(PROCESS_CLASS_FILE_TPL, packageName, prepareImports(), className,
          prepareInstanceVarsAndConstructor(), rootActionsVarName, processId, innerClasses);
    }

    private String prepareInnerClasses() throws ProcessConstructionException {
      final StringBuilder builder = new StringBuilder();
      for (final ActionClassContext innerClass : innerClasses) {
        builder.append(innerClass.getInnerClassSource(this));
      }
      return builder.toString();
    }

    private String prepareImports() {
      return imports.stream().map(Class::getName).sorted()
          .map(className -> String.format("import %s;", className))
          .collect(Collectors.joining("\n"));
    }

    private String prepareInstanceVarsAndConstructor() {
      final StringBuilder variableDeclarations = new StringBuilder();
      final StringBuilder constructorParams = new StringBuilder();
      final StringBuilder variableInitializations = new StringBuilder();
      final Iterator<Entry<Object, String>> varIterator = varNames.entrySet().iterator();
      while (varIterator.hasNext()) {
        final Entry<Object, String> next = varIterator.next();
        final boolean nonFinal = varIterator.hasNext();
        final Class<?> variableClass = next.getKey().getClass();
        final String simpleClassName = ensureImport(variableClass);
        final String varName = next.getValue();
        variableDeclarations
            .append(String.format("\tprivate final %s %s;\n", simpleClassName, varName));
        constructorParams.append(String.format("final %s %s", simpleClassName, varName));
        if (nonFinal) {
          constructorParams.append(", ");
        }
        variableInitializations.append(String.format("\t\tthis.%s = %s;\n", varName, varName));
      }
      childActionsToConstruct.forEach((varName, actionClassNames) -> {
        final String arguments =
            actionClassNames.stream().map(className -> String.format("new %s()", className))
                .collect(Collectors.joining(", "));
        variableDeclarations.append(String.format("\tprivate final Action[] %s;\n", varName));
        variableInitializations
            .append(String.format("\t\tthis.%s = new Action[]{%s};\n", varName, arguments));
      });
      return String.format("%s\n\tpublic %s(%s) {\n%s\t}\n", variableDeclarations, className,
          constructorParams, variableInitializations);
    }

  }

  private abstract class JavaWriter {

    public abstract void write(final StringBuilder builder, final ProcessClassInfo outerContext,
        final ActionClassContext innerContext) throws ProcessConstructionException;
  }

  @Getter
  private class ActionClassContext {

    private final int indexInProcess; // the global action count, used for unique inner class naming
    private final ProcessClassInfo parent;
    private final String path;
    private final int index; // the index of this action in the containing list, used for logging/metrics
    private final String actionName;

    private final String className;
    private final MethodWriter rootActionContext;

    private ActionClassContext(final int indexInProcess, final ProcessClassInfo parent,
        final String path, final int index, final ActionConfig actionConfig)
        throws ProcessConstructionException {
      this.indexInProcess = indexInProcess;
      this.parent = parent;
      this.path = path;
      this.index = index;

      this.className = "Action" + indexInProcess;

      this.actionName = actionConfig.getName();
      final ActionSpec actionSpec = loadAction(actionName);
      this.rootActionContext = new MethodWriter(actionSpec, actionConfig);
    }

    public String getInnerClassSource(final ProcessClassInfo outerContext)
        throws ProcessConstructionException {

      final String actionImpl = prepareActionImpl(outerContext);
      final String toString = escape(actionImpl);

      return String.format(ACTION_INNER_CLASS_TPL, className, actionImpl, actionName,
          parent.getProcessId(), path, index, toString);
    }

    private String prepareActionImpl(final ProcessClassInfo processClassInfo)
        throws ProcessConstructionException {

      final StringBuilder builder = new StringBuilder();

      rootActionContext.write(builder, processClassInfo, this);
      return builder.toString();
    }

    /**
     * Basic string escape implementation Java source code for the purpose of displaying the code as a toString displaying
     * the compiled logic for debug purposes.
     *
     * @param string the input string
     * @return
     */
    private String escape(String string) {
      return string.replace("\\", "\\\\").replace("\t", "\\t").replace("\b", "\\b")
          .replace("\n", "\\n").replace("\r", "\\r").replace("\f", "\\f").replace("\"", "\\\"");
    }
  }

  private abstract class ExpressionWriter extends JavaWriter {
  }

  @AllArgsConstructor
  private class StaticValueWriter extends ExpressionWriter {

    private final ParameterSpec parameterSpec;
    private final ValueConfig valueConfig;

    @Override
    public void write(final StringBuilder builder, final ProcessClassInfo processClassInfo,
        final ActionClassContext inner) throws ProcessConstructionException {

      final String value = valueConfig.getValue();
      final Class<?> type = parameterSpec.getType();
      if (String.class.equals(type)) {
        builder.append('"').append(value).append('"');
      } else if (boolean.class.equals(type)) {
        builder.append(Boolean.parseBoolean(value));
      } else if (Boolean.class.equals(type)) {
        builder.append("Boolean.").append(Boolean.parseBoolean(value) ? "TRUE" : "FALSE");
      } else if (int.class.equals(type)) {
        builder.append(Integer.parseInt(value));
      } else if (Integer.class.equals(type)) {
        builder.append("Integer.valueOf(\"").append(Integer.parseInt(value)).append("\")");
      } else if (long.class.equals(type)) {
        builder.append(Long.parseLong(value)).append('L');
      } else if (Long.class.equals(type)) {
        builder.append("Long.valueOf(\"").append(Long.parseLong(value)).append("\")");
      } else if (float.class.equals(type)) {
        builder.append(Float.parseFloat(value));
      } else if (Float.class.equals(type)) {
        builder.append("Float.valueOf(\"").append(Float.parseFloat(value)).append("\")");
      } else if (double.class.equals(type)) {
        builder.append(Double.parseDouble(value)).append('D');
      } else if (Double.class.equals(type)) {
        builder.append("Double.valueOf(\"").append(Double.parseDouble(value)).append("\")");
      } else {
        throw new ProcessConstructionException("Illegal value type: " + type);
      }
    }
  }

  @AllArgsConstructor
  private class ArgumentWriter extends ExpressionWriter {

    private final ParameterSpec spec;
    private final OneOf<List<ActionConfig>, List<InputConfig>> config;

    @Override
    public void write(final StringBuilder builder, final ProcessClassInfo outer,
        final ActionClassContext inner) throws ProcessConstructionException {
      final Class<?> type = spec.getType();
      final String name = spec.getName();
      if (spec instanceof ComputedParameterSpec computedParameterSpec) {
        if (config.isRight()) {
          final List<InputConfig> inputs = config.getRight();
          if (computedParameterSpec.isMulti()) {
            final String simpleClassName = outer.ensureImport(type);
            builder.append(simpleClassName).append("[]{");
            for (final InputConfig input : inputs) {
              writeInput(input, builder, outer, inner);
            }
            builder.append("}");
          } else if (!inputs.isEmpty()) {
            writeInput(inputs.get(0), builder, outer, inner);
          } else if (!type.isPrimitive()) {
            builder.append("null");
          } else {
            throw new ProcessConstructionException("Config is missing a required property value");
          }
        } else {
          throw new ProcessConstructionException("");
        }
      } else {
        if (type.equals(ModifiableExecutionContext.class)) {
          builder.append("context");
        } else if (type.equals(ExecutionContext.class)) {
          builder.append("readonlyContext");
        } else if (type.equals(ChildActions.class)) {
          if (config.isLeft()) {
            final String childPath =
                String.format("%s[%s]/%s", inner.getPath(), inner.getIndex(), name);
            final String varName = outer.addChildActions(config.getLeft(), childPath);
            builder.append(varName);
          }
        } else {
          final Injectable injectable = type.getAnnotation(Injectable.class);
          if (injectable != null) {
            final Class<? extends InjectableFactory> factoryClass = injectable.factory();
            final InjectableFactory injectableFactory = getInjectableFactory(factoryClass);
            final String varName = outer.ensureInstanceVar(injectableFactory);
            final String simpleClassName = outer.ensureImport(type);
            builder.append(varName).append(".getInjectable(").append(simpleClassName)
                .append(", context)");
          } else {
            throw new ProcessConstructionException("Unable to inject unknown type: " + type);
          }
        }
      }
    }

    private void writeInput(final InputConfig input, final StringBuilder builder,
        final ProcessClassInfo outer, final ActionClassContext inner)
        throws ProcessConstructionException {
      if (input instanceof ValueConfig valueConfig) {
        new StaticValueWriter(spec, valueConfig).write(builder, outer, inner);
      } else if (input instanceof FunctionConfig functionConfig) {
        final String functionName = functionConfig.getName();
        final FunctionSpec functionSpec = loadFunction(functionName);
        new MethodWriter(functionSpec, functionConfig).write(builder, outer, inner);
      }
    }
  }



  @Getter
  private class MethodWriter extends ExpressionWriter {

    private final MethodSpec methodSpec;
    private final List<Pair<ParameterSpec, OneOf<List<ActionConfig>, List<InputConfig>>>> argumentData;

    public MethodWriter(final MethodSpec methodSpec, final ActionConfig actionConfig) {
      this.methodSpec = methodSpec;
      argumentData = methodSpec.getParameters().stream()
          .map(parameterSpec -> new Pair<>(parameterSpec,
              OneOf.nullable(actionConfig.getActionArguments().get(parameterSpec.getName()),
                  actionConfig.getInputArguments().get(parameterSpec.getName()))))
          .collect(Collectors.toList());
    }

    public MethodWriter(final MethodSpec methodSpec, final FunctionConfig functionConfig) {
      this.methodSpec = methodSpec;
      argumentData = methodSpec.getParameters().stream().map(
          parameterSpec -> new Pair<ParameterSpec, OneOf<List<ActionConfig>, List<InputConfig>>>(
              parameterSpec,
              OneOf.right(functionConfig.getArguments().get(parameterSpec.getName()))))
          .collect(Collectors.toList());
    }

    @Override
    public void write(final StringBuilder builder, final ProcessClassInfo outer,
        final ActionClassContext inner) throws ProcessConstructionException {

      final Object provider = methodSpec.getProvider();
      final Method method = methodSpec.getMethod();

      final List<ParameterSpec> parameters = methodSpec.getParameters();
      if (provider instanceof Class<?>) {
        // static method call
        builder.append(((Class<?>) provider).getName()).append('.');
      } else {
        // instance method call
        String instanceVarName = outer.ensureInstanceVar(provider);
        builder.append(instanceVarName).append('.');
      }
      builder.append(method.getName()).append('(');

      // write out the comma-separated list of arguments
      for (int i = 0; i < argumentData.size(); i++) {
        final Pair<ParameterSpec, OneOf<List<ActionConfig>, List<InputConfig>>> data =
            argumentData.get(i);
        final ParameterSpec spec = data.getLeft();
        final OneOf<List<ActionConfig>, List<InputConfig>> config = data.getRight();

        final boolean isLast = i == parameters.size() - 1;

        final ArgumentWriter argumentContext = new ArgumentWriter(spec, config);
        argumentContext.write(builder, outer, inner);

        if (!isLast) {
          builder.append(", ");
        }
      }
      builder.append(')');
    }
  }

}
