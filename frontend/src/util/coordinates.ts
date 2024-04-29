export type Coordinates = readonly number[];

export const ROOT: Coordinates = [];

export function coordinatesEqual(a: Coordinates, b: Coordinates) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
}

export function coordinatesParent(coordinates: Coordinates): Coordinates {
  return coordinatesAncestor(coordinates, 1);
}

export function coordinatesAncestor(coordinates: Coordinates, depth: number): Coordinates {
  if (coordinates.length === 0) {
    throw new Error('The root coordinates have no ancestors');
  }
  return coordinates.slice(0, -depth);
}

export function coordinatesAbsoluteAncestor(
  coordinates: Coordinates,
  absoluteDepth: number,
): Coordinates {
  if (coordinates.length < absoluteDepth) {
    throw new Error('The coordinates are below the specified depth');
  }
  return coordinates.slice(0, absoluteDepth);
}

/**
 * Determines whether one set of coordinates are predecessor to another. Coordinates are predecessors
 * if they appear before the target in a depth-first search. This has implications for whether one
 * actions should be able to reference another action's variables.
 * @param coordinates
 * @param possiblePredecessor
 */
export function areCoordinatesPredecessor(
  coordinates: Coordinates,
  possiblePredecessor: Coordinates,
) {
  const sharedAncestor = getCoordinatesSharedAncestor(coordinates, possiblePredecessor);
  const sharedAncestorLength = sharedAncestor.length;
  if (coordinatesEqual(sharedAncestor, possiblePredecessor)) {
    return true;
  }
  return coordinates[sharedAncestorLength] > possiblePredecessor[sharedAncestorLength];
}

export function coordinatesNthChild(coordinates: Coordinates, n: number): Coordinates {
  return [...coordinates, ...[n]];
}

export function coordinatesAreSiblings(a: Coordinates, b: Coordinates) {}

export function getCoordinatesSharedAncestor(a: Coordinates, b: Coordinates): Coordinates {
  const minHeight = Math.min(a.length, b.length);
  if (minHeight === 0) {
    return ROOT;
  }
  for (let i = 1; i < minHeight; i++) {
    if (!coordinatesEqual(coordinatesAbsoluteAncestor(a, i), coordinatesAbsoluteAncestor(b, i))) {
      return coordinatesAbsoluteAncestor(a, i - 1);
    }
  }
  return coordinatesAbsoluteAncestor(a, minHeight);
}
