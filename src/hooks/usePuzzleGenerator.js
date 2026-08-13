import { useCallback, useRef } from "react";
import { createPuzzle } from "../puzzles/index.js";

const SEED_BASE = 4242;

/**
 * Every puzzle is generated fresh on demand — no caching or reuse pool.
 * A monotonically increasing seed means "New Puzzle" (and picking a
 * difficulty on the start screen) can never repeat a puzzle within a
 * session. The tradeoff is that every call pays full generation time
 * (up to a few hundred ms on a 9x9 "expert" board); App.jsx's `generating`
 * loading state exists specifically to cover that.
 */
export function usePuzzleGenerator() {
  const seedCounterRef = useRef(SEED_BASE);

  const nextSeed = useCallback(() => {
    seedCounterRef.current += 137;
    return seedCounterRef.current;
  }, []);

  const generateForDifficulty = useCallback((difficulty) => createPuzzle(difficulty, nextSeed()), [nextSeed]);

  return { generateForDifficulty };
}
