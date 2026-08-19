/**
 * Calculates intermediate tile positions when moving clockwise from startPos by rollTotal.
 * Returns array of tile indices, e.g. from 5 by 3 -> [6, 7, 8].
 * Also flags whether the movement crossed or landed on START (Index 0).
 */
export function calculateClockwisePath(startPos: number, steps: number): {
  path: number[];
  crossedStart: boolean;
  finalPosition: number;
} {
  const path: number[] = [];
  let crossedStart = false;
  let current = startPos;

  for (let i = 1; i <= steps; i++) {
    current = (current + 1) % 32;
    path.push(current);
    if (current === 0) {
      crossedStart = true;
    }
  }

  return {
    path,
    crossedStart,
    finalPosition: current,
  };
}
