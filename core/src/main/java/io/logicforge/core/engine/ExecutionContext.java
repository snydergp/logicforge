package io.logicforge.core.engine;

import io.logicforge.core.common.Coordinates;
import io.logicforge.core.exception.MissingVariableException;

/**
 * <p>
 * </p>
 * Variables represents a store of variables that can be accessed by during execution. Rather than
 * indexing by names,
 * variables use <i>coordinates</i>, an array of integers defined as follows:
 * </p>
 * <p>
 * <ul>
 * <li>An "executable" is either an action or a control structure</li>
 * <li>An "action" is an atomic executable. A single operation with inputs an an optional output,
 * intended to
 * encapsulate a side effect</li>
 * <li>A "control structure" is one or more blocks of executables. How or whether each blocks are
 * executed depends of
 * the type of control block and other inputs. For example, the CONDITIONAL block takes in a boolean
 * input value and
 * executes one of its two blocks depending on that value.</li>
 * <li>A "block" is a list of executables. Barring an error, when a block is executed, all
 * executables in that block
 * will eventually be executed.</li>
 * <li>A process is defined by a single "root" block</li>
 * <li>Root executables are defined by a single coordinate denoting their index
 * ({@code [0], [1], [2]})</li>
 * <li>Every additional level of nesting adds another item to the coordinates array, such that:
 * <ul>
 * <li>Root level executables have a single coordinate ({@code [0], [1], [2]})</li>
 * <li>A root level control structure's block each have 2 coordinates ({@code [1, 0], [1, 1]})</li>
 * <li>Executables defined inside a root level control structure block have 3 coordinates
 * ({@code [1, 1, 0], [1, 1, 1]})</li>
 * </ul>
 * </li>
 * </ul>
 * </p>
 * <p>
 * Given this definition, {@code Variables} stores the output of each action as it is executed as a
 * variable that can be
 * accessed by subsequent actions. In addition, "initial variables", or variables injected into the
 * processes when it is
 * started, are given coordinates made up of a single negative integer ({@code [-1], [-2], [-3]})
 * </p>
 */
public interface ExecutionContext {

  /**
   * Checks whether the resulting coordinate has both completed and outputted a non-null output
   * variable
   *
   * @param coordinates the action's coordinates, as defined above
   * @return whether the referenced action has both completed and output a variable
   */
  boolean isVariableSet(final Coordinates coordinates, final Class<?> expectedType,
      final String... path);

  /**
   * Get the variable stored by the referenced action
   *
   * @param coordinates the action's coordinates, as defined above
   * @return the variable stored by the action
   * @throws MissingVariableException if no variable was set by the action
   */
  <T> T getVariable(final Coordinates coordinates, final Class<T> expectedType,
      final String... path) throws MissingVariableException;

  /**
   * Checks whether the referenced action has completed. For non-async types, this will return true
   * as soon as
   * {@link #setVariable(Coordinates, Object)} has been called for the coordinates. For async types,
   * this will return
   * false until the async method has completed.
   */
  boolean isActionCompleted(final Coordinates coordinates);

  void setVariable(final Coordinates coordinates, final Object value);

  void await();

  <T> T convert(final Object value, final Class<T> type);

  boolean canConvert(final Object value, final Class<?> type);

}
