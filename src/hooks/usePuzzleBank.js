import { useCallback, useEffect, useRef, useState } from "react";
import { createPuzzle } from "../puzzles/index.js";
import { DIFFICULTY_ORDER, PUZZLES_PER_DIFFICULTY } from "../game/constants.js";

const SEED_BASE = 4242;

/**
 * Owns a per-difficulty puzzle bank, generated lazily: the first puzzle for
 * a difficulty is created synchronously the moment it's actually needed
 * (so picking "expert" costs one puzzle's generation time, not twenty),
 * and the rest of that difficulty's bank fills in the background one at a
 * time so the main thread is never blocked for long.
 */
export function usePuzzleBank() {
  const bankRef = useRef(Object.fromEntries(DIFFICULTY_ORDER.map((d) => [d, []])));
  const indexRef = useRef(Object.fromEntries(DIFFICULTY_ORDER.map((d) => [d, 0])));
  const seedCounterRef = useRef(SEED_BASE);
  // Bump this to force a re-render after background generation adds puzzles.
  const [, setVersion] = useState(0);

  const nextSeed = useCallback(() => {
    seedCounterRef.current += 137;
    return seedCounterRef.current;
  }, []);

  function ensureAtLeast(difficulty, count) {
    const arr = bankRef.current[difficulty];
    while (arr.length < count) {
      const puzzle = createPuzzle(difficulty, nextSeed());
      if (!puzzle) break;
      arr.push(puzzle);
    }
    return arr;
  }

  function currentPuzzle(difficulty) {
    const arr = ensureAtLeast(difficulty, 1);
    return arr[indexRef.current[difficulty] % arr.length];
  }

  function nextPuzzle(difficulty, avoidId) {
    const arr = ensureAtLeast(difficulty, 1);
    const idx = indexRef.current;
    idx[difficulty] = (idx[difficulty] + 1) % arr.length;
    let puzzle = arr[idx[difficulty]];

    if (avoidId && puzzle.id === avoidId && arr.length === 1) {
      const fresh = createPuzzle(difficulty, nextSeed());
      if (fresh) puzzle = fresh;
    }
    return puzzle;
  }

  // Background-fill the rest of each difficulty's bank in idle slices so a
  // burst of "New Puzzle" clicks (or switching difficulty) rarely has to
  // generate on the spot.
  useEffect(() => {
    let cancelled = false;
    let diffIndex = 0;

    function fillNext() {
      if (cancelled) return;
      const difficulty = DIFFICULTY_ORDER[diffIndex];
      const arr = bankRef.current[difficulty];
      if (arr.length < PUZZLES_PER_DIFFICULTY) {
        const puzzle = createPuzzle(difficulty, nextSeed());
        if (puzzle) arr.push(puzzle);
        setVersion((v) => v + 1);
      } else {
        diffIndex += 1;
      }
      if (diffIndex < DIFFICULTY_ORDER.length) {
        setTimeout(fillNext, 30);
      }
    }

    const id = setTimeout(fillNext, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { currentPuzzle, nextPuzzle };
}
