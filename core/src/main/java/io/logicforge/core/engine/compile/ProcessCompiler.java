package io.logicforge.core.engine.compile;

import io.logicforge.core.common.Pair;
import io.logicforge.core.common.TypedArgument;
import io.logicforge.core.engine.Process;
import io.logicforge.core.exception.ProcessConstructionException;
import lombok.Getter;

import javax.tools.DiagnosticCollector;
import javax.tools.FileObject;
import javax.tools.ForwardingJavaFileManager;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileManager;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.net.URI;
import java.security.SecureClassLoader;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class ProcessCompiler {

  public <T extends Process> T compileAndInstantiate(final String className, final String code,
      final List<TypedArgument> argumentsAndTypes, Class<T> type)
      throws ProcessConstructionException {

    final InMemorySource source = new InMemorySource(className, code);

    final JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    final InMemoryFileManager fileManager =
        new InMemoryFileManager(compiler.getStandardFileManager(null, null, null));
    final DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();

    final StringWriter javacLog = new StringWriter();
    final List<InMemorySource> toCompile = List.of(source);
    final JavaCompiler.CompilationTask task = compiler.getTask(javacLog, fileManager, diagnostics,
        List.of("-g:source,lines,vars"), null, toCompile);

    boolean success = task.call();
    // TODO log diagnostic info

    if (success) {
      return loadClassInstance(fileManager, className, argumentsAndTypes, type);
    } else {
      throw new ProcessConstructionException("Error compiling process actions: "
          + diagnostics.getDiagnostics().stream().map(diagnostic -> diagnostic.getLineNumber() + " "
              + diagnostic.getMessage(Locale.ENGLISH)).collect(Collectors.joining("\n")));
    }
  }


  private <T extends Process> T loadClassInstance(final InMemoryFileManager fileManager,
      final String className, final List<TypedArgument> argumentsAndTypes, final Class<T> type)
      throws ProcessConstructionException {

    try {
      final Class<?> loaded = fileManager.getClassLoader(null).loadClass(className);
      if (!Process.class.isAssignableFrom(loaded)) {
        throw new ProcessConstructionException("Compiled process does not represent expected type");
      }
      final Class<? extends T> actionClass = (Class<? extends T>) loaded;
      final Class<?>[] argTypes =
          argumentsAndTypes.stream().map(TypedArgument::getType).toArray(Class<?>[]::new);
      final Object[] args =
          argumentsAndTypes.stream().map(TypedArgument::getArgument).toArray(Object[]::new);
      final Constructor<? extends T> constructor = actionClass.getConstructor(argTypes);
      return constructor.newInstance(args);
    } catch (ClassNotFoundException | NoSuchMethodException | InstantiationException
        | IllegalAccessException | InvocationTargetException e) {
      throw new ProcessConstructionException("Error loading generated process class", e);
    }
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
    public InMemorySource getJavaFileForOutput(Location location, String className,
        JavaFileObject.Kind kind, FileObject sibling) {
      if (classes.containsKey(className)) {
        return classes.get(className);
      } else {
        final InMemorySource inMemorySource = new InMemorySource(className, kind);
        classes.put(className, inMemorySource);
        return inMemorySource;
      }
    }
  }

}
