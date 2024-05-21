> ## Status
>
> * [2024-05-20] Major refactor of the data model complete, with added abstractions representing
    value (variable) storage and referencing of stored variables. Major progress made on the
    frontend and end-to-end demos.
> * [2023-12-28] I've decided to clean this project up and bring it public, despite it very much
    still being a work-in-progress. See the [roadmap](#roadmap) section below for details on how I'd
    like to evolve things from here.

# LogicForge

LogicForge is a metaprogramming/visual programming library that facilitates the creation of
"advanced editing" features which users can leverage to create complex logic for later execution.
Some example use cases are:

* For a content management system, allowing authors to target or secure content based on a user
  profile
* For a CDN, allowing admins to set up A/B testing or routing based on user profile
* For analytics processing, allowing users to set up custom alerts and/or custom actions based on
  input filters

## Functionality

LogicForge generates user-configured implementations for developer-defined interface methods,
allowing users to create customized logic without coding.

For example, a developer might create this interface that exposes a simple web server
request/response:

```java
package io.logicforge.demo.model.domain;

import io.logicforge.core.engine.Process;

public interface WebServerProcess extends Process {

  HttpResponse respond(final HttpRequest request);

}
```

The LogicForge engine analyzes the provided method to determine the parameters and outputs, then
builds a specification that models not only the process, but any functions and actions the end user
can access while implementing the process. Developers have complete control over the available
actions and functions, and can add custom capabilities with minimal effort.

![LogicForge UI](docs/images/ui-webserver.png "LogicForge UI")

The frontend consists of React components that provide the capability to edit the logic of the
process. Users can reference input variables, perform actions, and leverage functions.

The saved process configuration model can then be instantiated into a dynamic implementation of the
process interface and called as a normal Java method. Process objects can be called multiple times
with different arguments, are thread-safe, and can be cached in-memory.

```java
import io.logicforge.core.engine.ExecutionQueue;
import io.logicforge.demo.model.domain.HttpRequest;
import io.logicforge.demo.model.domain.HttpResponse;
import io.logicforge.demo.model.domain.WebServerProcess;

public class CustomWebServer {

  private final WebServerProcess webServerProcess;

  public CustomWebServer(final ProcessConfig<WebServerProcess, UUID> processConfig,
      // The user-generate process config
      final ProcessBuilder processBuilder,
      // Used to convert the persisted process config into a callable object
      final ExecutionQueue executionQueue
      // Used to define allowed concurrency and throughput
  ) {
    this.webServerProcess = builder.buildProcess(processConfig, executionQueue);
  }

  public HttpResponse getCustomResponse(final HttpRequest request) {
    return webServerProcess.respond(request);
  }
}
```

## Type System

LogicForge exposes a simplified type system to users for ease of comprehension by non-technical
users. Notable features of the type system include:

### Inheritance

LogicForge builds a dynamic type system based on the input/output types of the registered actions,
functions, and processes. When specifying expressions as inputs, users can use expressions that
return either the specified type of the input, or any or its subtypes.

### Automatic Conversion

Type conversions are handled transparently. Since the user does not need to manually convert between
types, an expression returning an integer can be used to satisfy an input requiring a string.
Converter methods can be registered to provide automatic conversions between any two types.

### Multiplicity

There are no builtin collection types. All types represent scalar values, but input or output
expressions can allow multiple values. When an input allows multiple values, users will be able to
add multiple expressions that satisfy the input type. Users will also be able to add expressions
that themselves return multiple values, provided the expression's outputted scalar type satisfies
the required input type. In this case, all output values will be "flattened" into a single array.

### Future values

Futures allow an action to execute in the background, concurrently with subsequent actions. This is
useful in scenarios where multiple independent long-running actions (e.g., reading a file, making a
web request) are executed in series. Rather than executing in series, the actions can be kicked off
in separate threads and waited on by subsequent actions, potentially saving time. This is supported
transparently to the end user for actions that return a Java Future type.

Future actions are executed by a thread pool. When a subsequent action references a Future value, it
be awaited transparently.

## Data Models

LogicForge models arbitrary logic as a tree of configuration objects. This tree can be persisted and
converted to callable java implementations as needed. The data model is described below.

### Specification Model

The specification model defines the capabilities exposed by a given LogicForge engine instance.

#### Engine Specification

The engine specification model defines the capabilities of a LogicForge engine instance, including
available processes, actions, functions, and the type system.

| Property  | Type                                                              |
|-----------|-------------------------------------------------------------------|
| processes | Map<ProcessId, [ProcessSpecification](#process-specification)>    |
| types     | Map<TypeId, [TypeSpecification](#type-specification)>             |
| actions   | Map<ActionId, [ActionSpecification](#action-specification)>       |
| functions | Map<FunctionId, [FunctionSpecification](#function-specification)> |

#### Process Specification

Process Specification represents the input parameters and output type of a user-configurable
process.

| Property | Type                                                           |
|----------|----------------------------------------------------------------|
| id       | ProcessId (String)                                             |
| inputs   | List<[InputSpecification](#input-specification)>               |
| output   | Optional<[ExpressionSpecification](#expression-specification)> |

#### Type Specification

A Type Specification represents a scalar runtime type and its relationship to other types.
Types that represent enumerations have a pre-defined list of available values, whereas compound
types have a list of available properties.

| Property   | Type                                                              |                                                                           |
|------------|-------------------------------------------------------------------|---------------------------------------------------------------------------|
| id         | TypeId (String)                                                   |                                                                           | 
| supertypes | List<TypeId>                                                      |                                                                           | 
| values     | List<ValueId>                                                     | Only present on enumerations                                              |
| properties | Map<PropertyId, [PropertySpecification](#property-specification)> | Only present on compound types                                            |
| valueType  | boolean                                                           | A flag that denotes whether the type can be represented by a simple value |

#### Property Specification

A Property Specification defines a property on a compound type.

| Property | Type                |
|----------|---------------------|
| id       | PropertyId (String) |
| type     | TypeId (String)     |
| multiple | boolean             |
| optional | boolean             |

#### Action Specification

An Action Specification defines an available action.

| Property | Type                                                           |                                               |
|----------|----------------------------------------------------------------|-----------------------------------------------|
| id       | ActionId (String)                                              |                                               |
| inputs   | List<[InputSpecification](#input-specification)>               |                                               |
| output   | Optional<[ExpressionSpecification](#expression-specification)> | Only present on actions with non-void returns |

#### Function Specification

An Function Specification defines an available function.

| Property | Type                                                 |
|----------|------------------------------------------------------|
| id       | FunctionId (String)                                  |
| inputs   | List<[InputSpecification](#input-specification)>     |
| output   | [ExpressionSpecification](#expression-specification) |

#### Expression Specification

An expression specification represents the "shape" of a particular input or output value.

| Property | Type                  |                                                                                                                          |
|----------|-----------------------|--------------------------------------------------------------------------------------------------------------------------|
| type     | List<TypeId> (String) | Will generally consist of a single value. Can also consist of multiple values ("union types") or no values ("void type") |
| multiple | Boolean               |                                                                                                                          |

#### Input Specification

An input specification is an expression specification with additional metadata. The metadata is used
to convey special relationships about the input to assist in editing.

| Property                    | Type                |
|-----------------------------|---------------------|
| (All Expression Properties) |
| metadata                    | Map<String, Object> |

### Configuration Model

The configuration model defines the structure used to represent a specific process implementation.
Each configuration is relative to a particular specification. Updating the specification (e.g.,
removing actions or functions) might invalidate the configuration or lead to unintended execution.

#### Process

A process represents user-defined actions, control structures, and their inputs. For processes with
a return type, an output expression will also be configured. Actions and control structures are
wrapped in "[blocks](#block)", and each process consists of a single "root block".

| Property         | Type                      |
|------------------|---------------------------|
| rootBlock        | [Block](#block)           |
| returnExpression | [Expression](#expression) |

#### Block

A block represents a series of [Executables](#executable). Executables are executed in series, and
subsequent executables are started as soon as previous executables complete.

| Property    | Type                            |
|-------------|---------------------------------|
| executables | List<[Executable](#executable)> |

#### Executable

Executable is an abstraction representing an executable entity. The concrete
instances of Executable are [Action](#action) and [Control Structure](#control-structure).

#### Action

An action is an Executable function. Actions are structurally identical to [Functions](#function),
although actions are able to manipulate state and actions do not necessarily need a non-void return
type. When an action does have a non-void return, it's return value will be stored and can be
referenced by subsequent actions.

| Property | Type                                   | Note                                                                                 |
|----------|----------------------------------------|--------------------------------------------------------------------------------------|
| name     | String                                 | Maps the action configuration to its runtime method                                  |
| inputs   | Map<String, [Expression](#expression)> | Expression configurations for each of the actions inputs, mapped by the input's name |
| output   | Optional<[Variable](#variable)>        | Only present for actions with non-void returns                                       |

#### Control Structure

A control structure is used to control when and whether one or more child blocks are executed. At
present, the only supported control structure is the Conditional, which executes one of two blocks
based on a boolean input.

When a control structure is executed and decides to execute a child block, all of the child block's
executables will be executed before the control statement's execution completes.

| Property    | Type                                   | Note                                                                                              |
|-------------|----------------------------------------|---------------------------------------------------------------------------------------------------|
| controlType | "CONDITIONAL"                          |                                                                                                   |
| inputs      | Map<String, [Expression](#expression)> |                                                                                                   |
| blocks      | List<[Block](#block)>                  | Indexed list of child blocks, the identity of which is dependent on the type of control structure |

For the CONDITIONAL control type, a single input "condition" is declared, and there are two
configurable child blocks: "then" (executed if true) and "else" (executed if false).

#### Variable

A Variable represents a stored value returned by an [Action](#action). It allows users to configure
a name to represent the stored value, to help discern it from any other stored values that may be
available. The title of a variable is only used for human display, not during actual execution.

| Property | Type   |
|----------|--------|
| title    | String |

#### Expression

Expression is an abstraction representing any structure that evaluates to a value. Expressions are
used to define inputs for actions and functions. The concrete Expression subtypes
are [Function](#function), [Reference](#reference), and [Value](#value).

#### Function

A function represents a callable method with inputs and a return value. Unlike Actions, Functions
are intended to represent "pure functions" which do not mutate state.

| Property | Type                                   | Note                                                                                 |
|----------|----------------------------------------|--------------------------------------------------------------------------------------|
| name     | String                                 | Maps the function configuration to its runtime method                                |
| inputs   | Map<String, [Expression](#expression)> | Expression configurations for each of the actions inputs, mapped by the input's name |

#### Reference

A reference is a usage of a stored value. If the referenced type is compound (
see [Types](#types)), a child property can also be selected in place of the parent
value. In addition to values stored bu actions, processes may specify input parameters that can also
be referenced.

Compound types may be deeply-nested. As a result a reference might define a list of properties use
to deference the stored value in series.

| Property    | Type        | Note                                                                                                                                                                                                  |
|-------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| coordinates | Coordinates | The coordinates of the executable that stored the variable. Each action has a unique set of coordinates. Input variables supplied to the process are accessed via the special case "root coordinates" |
| path        | String[]    | An array of property names, each representing a property defined on a compound types.                                                                                                                 |

#### Value

A static value. To simplify persistence, all values are stored as a String representation. Static
values are associated with a type ID that indicates the runtime type to use for the value.

| Property | Type   |
|----------|--------|
| value    | String |
| typeId   | String | 

## Configuration

The LogicForge engine is configured by providing it with a series of annotated Java methods
representing processes, actions, functions, and converters. Methods can be static, or bound to a
particular class instance. In addition, custom types can be added that allow users to access child
properties or call instance methods.

### Processes

Custom processes can be configured by creating an interface that extends the
builtin [Process](core/src/main/java/io/logicforge/core/engine/Process.java) interface. Process
interfaces should declare a single public method representing the desired inputs and an optional
return value.

Processes can be added to the engine specification
via [EngineSpecBuilder](core/src/main/java/io/logicforge/core/model/domain/specification/EngineSpecBuilder.java)'
s `withProcess` method.

```java
public interface CustomProcess extends Process {
  boolean doSomething(final int a, final String b);
}

public EngineSpec configureEngine() {
  return new EngineSpecBuilder()
      // Add a process class
      .withProcess(CustomProcess.class)

      // ...Additional configuration
      .build();
}
```

### Actions, Functions and Converters

Actions and Functions exist as Java methods annotated
with [@Action](core/src/main/java/io/logicforge/core/annotations/elements/Action.java),
[@Function](core/src/main/java/io/logicforge/core/annotations/elements/Function.java),
or [@Converter](core/src/main/java/io/logicforge/core/annotations/elements/Converter.java).
Methods are encapsulated by "providers" which are either the wrapping class (for static methods) or
instance (for instance methods).

LogicForge provides a builtin library of actions, functions, and converters. The BuiltinProviders
class exposes all of the wrapping provider classes for easy configuration.

```java
public static class CustomProviders {

  @Function
  public static String divide(int a, int b) {
    return a / b;
  }

  @Action
  public static String readFile() {
    final Path path = Path.of("/well-known-path.txt");
    return Files.readString(path);
  }
}

public EngineSpec configureEngine() {
  return new EngineSpecBuilder()
      // Add builtin providers
      .withProviderClasses(BuiltinProviders.getAll())
      // Add custom provider
      .withProviderClasses(CustomProviders.class)

      // ...Additional configuration
      .build();
}
```

### Types

The type system does not need to be configured manually, as it is inferred from the full set of
declared parameter and return types on all configured actions, functions, converters, and processes.
The java object hierarchy is used to determine supertype/subtype information, which is used to
enforce type-checking as the user is configuring a process. Converters are used to bridge types that
don't have a builtin super/sub-type relationship.

When a custom type is used, it will be treated as a value type by default, meaning it's value can be
passed as an input or return value, but sub-properties cannot be accessed. If you want users to be
able to leverage sub-properties, the class should be annotated
with [@CompoundType](core/src/main/java/io/logicforge/core/annotations/elements/CompoundType.java)
and any fields that should be accessible should be annotated
with [@Property](core/src/main/java/io/logicforge/core/annotations/elements/Property.java).

```java
public static class CustomFunctions {
  @Function
  public CustomType buildCustomType(final String a, final int b) {
    return new CustomType(a, b);
  }
}


@CompoundType
@RequiredArgsConstructor
@Getter
public static class CustomType {

  @Property
  private String a;
  @Property
  private int b;

}

public EngineSpec configureEngine() {
  return new EngineSpecBuilder()
      // Add custom provider
      .withProviderClasses(CustomFunctions.class)
      // compound type 'CustomType' is automatically added to the type
      //  system and properties 'a' and 'b' will be available to users

      // ...Additional configuration
      .build();
}
```

## Roadmap

This section contains prospective future features and releases.

* MVP (`0.1.0`)
    * Frontend:
        * Clean up UX interactions (tab support, selection management)
    * Backend
        * Basic set of builtin actions/functions/converters
        * Thread management, including timeouts
        * Two ProcessBuilder implementations
            * CompilationBuilder (compiles processes into Java classes, requires JDK)
            * ReflectionBuilder (dynamically executes processes via Java Reflection)
    * Demo:
        * Add demo specifications and starting configuration for 3 use cases
            * Web Server
            * Event Filter
            * Segmentation
* Hardening
    * Unit tests for core and frontend libraries
    * Cucumber integration tests for demo
    * Add Reflection-based processor for non-JVM systems
    * Solidify developer documentation
* Performance (`1.0.0`)
    * Write performance test scripts
    * ASM-based class generation
    * Maven Central release
    * NPM Release
    * Demo Docker image release
* Capability Plugins
    * Add capability modules that can be included to extend the engine. Plugin modules will include
      functions and/or actions aligned with a specific problem domain. Potential modules:
        * HTTP (send and/or process HTTP requests)
        * Structure (utilities for dealing with structured data, including JSON and YAML)
        * Crypto (encryption, decryption, hashing)
        * File (operations for interacting with a filesystem)
        * Image (ImageMagick wrapper)
        * AI (submit prompts to a LLM (ollama?))
* Observability
* Advanced Management
    * Process/Action-specific timeouts
    * Complexity budgets
    * Automated caching & invalidation of Processes and Engines
