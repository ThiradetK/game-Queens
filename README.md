# Queens — ปริศนา

A LinkedIn-Queens-style puzzle: place one Queen (♛) in every row, column, and
colored region, with no two Queens diagonally adjacent.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

## Project structure

```
src/
  game/          pure game engine — no React, fully unit-testable
    validator.js   placement + win-condition rules
    solver.js       backtracking solver (countSolutions / findSolutions / solve)
    generator.js     puzzle generation with an active "repair" step that
                      eliminates alternate solutions until exactly one remains
    constants.js     region colors, difficulty config
    puzzleUtils.js   small pure helpers (PRNG, neighbors, empty board, etc.)

  puzzles/       puzzle-sourcing layer (currently: procedural generation)
  store/         gameStore.js — reducer-based game state (useGameStore hook)
  hooks/         usePuzzleGenerator.js — generates a fresh puzzle on demand
                  (no caching/pooling — every "New Puzzle" click and every
                  difficulty pick on the start screen is a brand new,
                  never-repeated board)
  components/    UI, one concern per file
  utils/         formatTime, sound
  styles/        Tailwind entry + design tokens (globals.css)
```

## Design notes

- **Hints never place a queen for you.** They only report whether a queen
  you've already placed is right or wrong (or nudge you to place one first).
- **Difficulty is chosen on a start screen** before the board loads; it can't
  be changed mid-puzzle (use the back arrow to return to that screen).
- **Puzzle uniqueness is enforced**, not assumed: `generator.js` runs an
  active repair loop that finds alternate solutions via the solver and
  mutates the region map to eliminate them, then re-verifies before shipping
  a puzzle to the UI.
- **Regions are clean contiguous blobs**, matching the reference game's look
  — the repair loop prefers adjacency-preserving swaps first (a cell only
  ever moves into a region it's already touching) and falls back to a
  non-adjacent move only when no local fix exists; a `smoothFragments` pass
  then merges any resulting stray cells back into a neighbor, re-checking
  the solver before every merge so uniqueness is never sacrificed for
  appearance. Verified empirically at 0 stray cells / 0 fragmented regions
  across 80 generated puzzles (20 per difficulty).
- **Dark mode / reduced motion** are real settings — toggling "แอนิเมชัน" off
  adds `.motion-reduced` to `<html>`, which zeroes out all CSS
  animation/transition durations app-wide (see `styles/globals.css`).
- **Progress survives a refresh.** While a puzzle is in progress,
  `utils/storage.js` persists the puzzle, board, difficulty, hint count,
  and start timestamp to `localStorage` (key `queens-game-state`). On next
  load, if a saved entry exists the app resumes straight into that board
  instead of showing the start screen. The saved entry is cleared the
  moment the puzzle is completed, or if you use the back button to
  deliberately abandon it — there's never a "used up" entry lying around.
  Corrupted/invalid storage data is validated and ignored rather than
  crashing the app.

## Testing

`smoke-test.mjs` is a headless end-to-end check: it builds the real app,
loads the actual production bundle into a jsdom `window`/`document` (not a
re-implementation of the logic), and drives it via real DOM clicks —
covering the start screen, the X→Queen→empty interaction cycle, hint
messages (empty-board nudge, wrong, correct), reset, the back button,
switching board size between difficulties, dark mode, keyboard navigation,
hint-quota exhaustion, a full win by actually solving a generated puzzle
through clicks, "New Puzzle" never repeating across clicks, and localStorage
persistence — including a genuine page-reload simulation (a second jsdom
window, pre-seeded with the exact `localStorage` value the first session
wrote, importing a cache-busted copy of the same bundle) that verifies an
in-progress game actually resumes with its queens, marks, and hint count
intact, that completing or backing out of a puzzle clears the saved entry,
and that corrupted storage data falls back to the start screen instead of
crashing.

```bash
npm run test:smoke
```

This runs a `development`-mode build (so a test-only, otherwise dead-code-
eliminated hook can expose the current puzzle to the harness) and reports
any runtime/console errors it captured along the way. The hook never ships
in `npm run build`'s production output — verify with:

```bash
npm run build && grep -c "__QUEENS_EXPOSE_PUZZLE__" dist/assets/*.js   # expect 0
```
