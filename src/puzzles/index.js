import { generatePuzzle } from "../game/generator.js";

/**
 * Thin puzzle-sourcing layer used by `hooks/usePuzzleGenerator.js`. Kept
 * separate from the hook so puzzle sourcing (currently: procedural
 * generation) could later be swapped for a fetched/static puzzle set
 * without touching any React code.
 */
export function createPuzzle(difficulty, seed) {
  return generatePuzzle(difficulty, seed);
}
