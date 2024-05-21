export type Coordinates = readonly number[];

export const ROOT_COORDINATES: Coordinates = [];

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
 * @param referenceCoordinates
 * @param testCoordinates
 */
export function areCoordinatesPredecessor(
  referenceCoordinates: Coordinates,
  testCoordinates: Coordinates,
) {
  const sharedAncestor = getCoordinatesSharedAncestor(referenceCoordinates, testCoordinates);
  const sharedAncestorLength = sharedAncestor.length;
  if (coordinatesEqual(sharedAncestor, referenceCoordinates)) {
    return true;
  }
  return referenceCoordinates[sharedAncestorLength] < testCoordinates[sharedAncestorLength];
}

export function coordinatesNthChild(coordinates: Coordinates, n: number): Coordinates {
  return [...coordinates, ...[n]];
}

export function coordinatesAreSiblings(a: Coordinates, b: Coordinates) {
  return coordinatesEqual(coordinatesParent(a), coordinatesParent(b));
}

export function getCoordinatesSharedAncestor(a: Coordinates, b: Coordinates): Coordinates {
  const minHeight = Math.min(a.length, b.length);
  for (let i = 0; i < minHeight; i++) {
    if (a[i] !== b[i]) {
      return a.slice(0, i);
    }
  }
  return a.slice(minHeight);
}
