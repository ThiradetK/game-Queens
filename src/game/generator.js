import { DIFFICULTY_CONFIG } from "./constants.js";
import { mulberry32, shuffle, getNeighbors } from "./puzzleUtils.js";
import { countSolutions, findSolutions } from "./solver.js";

/** Random valid queen solution: one per row/col, no diagonal adjacency. */
function generateSolution(size, rand) {
  const cols = new Array(size).fill(-1);
  const usedCols = new Set();

  function backtrack(row) {
    if (row === size) return true;
    const order = shuffle(
      Array.from({ length: size }, (_, i) => i),
      rand
    );
    for (const col of order) {
      if (usedCols.has(col)) continue;
      if (row > 0 && Math.abs(col - cols[row - 1]) === 1) continue;
      cols[row] = col;
      usedCols.add(col);
      if (backtrack(row + 1)) return true;
      usedCols.delete(col);
      cols[row] = -1;
    }
    return false;
  }

  if (backtrack(0)) return cols.map((col, row) => ({ row, col }));
  return null;
}

/**
 * Randomized flood-fill: each region grows outward from its queen cell.
 * `complexity` biases how often a random (vs. smallest) region claims the
 * next cell — higher complexity produces more irregular, jagged regions.
 *
 * On its own this routinely produces boards with a dozen-plus valid
 * solutions (regions this loosely shaped barely constrain the puzzle) —
 * `repairToUnique` + `smoothFragments` below are what drive the board down
 * to exactly one solution while keeping regions as clean contiguous blobs.
 */
function growRegions(size, solution, complexity, rand) {
  const regionOf = Array.from({ length: size }, () => new Array(size).fill(-1));
  solution.forEach((q, idx) => {
    regionOf[q.row][q.col] = idx;
  });

  const regionSizes = new Array(size).fill(1);
  const frontiers = solution.map((q) =>
    getNeighbors(q.row, q.col, size).filter(([r, c]) => regionOf[r][c] === -1)
  );

  let remaining = size * size - size;
  let guard = 0;
  const guardLimit = size * size * 20;

  while (remaining > 0 && guard < guardLimit) {
    guard++;
    const candidates = [];
    for (let i = 0; i < size; i++) {
      frontiers[i] = frontiers[i].filter(([r, c]) => regionOf[r][c] === -1);
      if (frontiers[i].length > 0) candidates.push(i);
    }
    if (candidates.length === 0) break;

    const regionIdx =
      rand() < complexity
        ? candidates[Math.floor(rand() * candidates.length)]
        : candidates.reduce((best, i) => (regionSizes[i] < regionSizes[best] ? i : best), candidates[0]);

    const frontier = frontiers[regionIdx];
    const [r, c] = frontier[Math.floor(rand() * frontier.length)];
    regionOf[r][c] = regionIdx;
    regionSizes[regionIdx]++;
    remaining--;

    frontiers[regionIdx].push(...getNeighbors(r, c, size).filter(([nr, nc]) => regionOf[nr][nc] === -1));
  }

  // Safety net for any unreachable leftover cells (rare on small boards).
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regionOf[r][c] === -1) {
        const nb = getNeighbors(r, c, size).find(([nr, nc]) => regionOf[nr][nc] !== -1);
        regionOf[r][c] = nb ? regionOf[nb[0]][nb[1]] : 0;
      }
    }
  }

  return regionOf;
}

/**
 * Mutates `regions` in place toward a unique solution. Each step finds a
 * different valid solution ("alt") than the intended one and a row where
 * they diverge, then:
 *
 *  1. First tries a LOCAL move: reassign the alt-queen's cell to one of its
 *     immediate neighboring regions (only if that neighbor region is one
 *     an alt-solution queen already occupies, so the swap directly kills
 *     this alt solution). This keeps regions contiguous — the cell simply
 *     becomes part of an adjacent blob it was already touching.
 *  2. Only if no such local move exists this round does it fall back to a
 *     non-adjacent global reassignment, which can leave a stray one-cell
 *     fragment — `smoothFragments` cleans those up afterward.
 */
function repairToUnique(regions, solution, size, rand, maxSteps) {
  const solutionCols = solution.map((q) => q.col);

  for (let step = 0; step < maxSteps; step++) {
    const solutions = findSolutions(regions, size, 20);
    if (solutions.length <= 1) return true;

    const alt = solutions.find((s) => s.some((col, row) => col !== solutionCols[row]));
    if (!alt) return true;

    const diffRows = [];
    for (let row = 0; row < size; row++) {
      if (alt[row] !== solutionCols[row]) diffRows.push(row);
    }
    const shuffledRows = shuffle(diffRows, rand);

    let applied = false;
    for (const row of shuffledRows) {
      const altCol = alt[row];
      const ownRegion = regions[row][altCol];

      const altUsedRegions = new Set();
      for (let r2 = 0; r2 < size; r2++) {
        if (r2 !== row) altUsedRegions.add(regions[r2][alt[r2]]);
      }

      const neighborRegions = getNeighbors(row, altCol, size)
        .map(([nr, nc]) => regions[nr][nc])
        .filter((rid) => rid !== ownRegion);
      const target = neighborRegions.find((rid) => altUsedRegions.has(rid));
      if (target === undefined) continue;

      regions[row][altCol] = target;
      applied = true;
      break;
    }

    if (!applied) {
      const row = shuffledRows[0];
      const altCol = alt[row];
      const otherRows = Array.from({ length: size }, (_, i) => i).filter((r) => r !== row);
      const targetRow = otherRows[Math.floor(rand() * otherRows.length)];
      regions[row][altCol] = regions[targetRow][solutionCols[targetRow]];
    }
  }

  return countSolutions(regions, size, 2) === 1;
}

/**
 * Merges any stray single/multi-cell fragments (left behind by the global
 * fallback in `repairToUnique`) back into a neighboring region — but only
 * when doing so still leaves the puzzle with exactly one solution, checked
 * via the solver before each merge is committed. Each region's own queen
 * cell ("anchor") is never touched, so it can never be merged away.
 */
function smoothFragments(regions, solution, size, maxIterations) {
  for (let iter = 0; iter < maxIterations; iter++) {
    let changedAny = false;

    for (let id = 0; id < solution.length; id++) {
      const anchor = solution[id];
      const cells = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === id) cells.push([r, c]);
        }
      }

      // Component containing this region's own queen cell = the "main" blob.
      const mainSet = new Set([`${anchor.row},${anchor.col}`]);
      const stack = [[anchor.row, anchor.col]];
      while (stack.length) {
        const [r, c] = stack.pop();
        for (const [nr, nc] of getNeighbors(r, c, size)) {
          if (regions[nr][nc] === id) {
            const key = `${nr},${nc}`;
            if (!mainSet.has(key)) {
              mainSet.add(key);
              stack.push([nr, nc]);
            }
          }
        }
      }

      const strays = cells.filter(([r, c]) => !mainSet.has(`${r},${c}`));
      for (const [r, c] of strays) {
        const neighborCounts = {};
        for (const [nr, nc] of getNeighbors(r, c, size)) {
          const rid = regions[nr][nc];
          if (rid !== id) neighborCounts[rid] = (neighborCounts[rid] || 0) + 1;
        }
        const candidates = Object.keys(neighborCounts)
          .map(Number)
          .sort((a, b) => neighborCounts[b] - neighborCounts[a]);

        for (const candidate of candidates) {
          const original = regions[r][c];
          regions[r][c] = candidate;
          if (countSolutions(regions, size, 2) === 1) {
            changedAny = true;
            break;
          }
          regions[r][c] = original;
        }
      }
    }

    if (!changedAny) return true;
  }
  return countSolutions(regions, size, 2) === 1;
}

/** Counts cells that don't belong to their region's main connected blob. */
function countStrayCells(regions, solution, size) {
  let totalStray = 0;
  for (let id = 0; id < solution.length; id++) {
    const anchor = solution[id];
    const mainSet = new Set([`${anchor.row},${anchor.col}`]);
    const stack = [[anchor.row, anchor.col]];
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [nr, nc] of getNeighbors(r, c, size)) {
        if (regions[nr][nc] === id) {
          const key = `${nr},${nc}`;
          if (!mainSet.has(key)) {
            mainSet.add(key);
            stack.push([nr, nc]);
          }
        }
      }
    }

    let regionTotal = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === id) regionTotal++;
      }
    }
    totalStray += regionTotal - mainSet.size;
  }
  return totalStray;
}

/**
 * Generates a puzzle with exactly one solution AND regions that are each a
 * single contiguous blob (no scattered stray cells). Each outer attempt
 * starts from a fresh random solution + region layout, repairs it toward
 * uniqueness, then smooths away any fragments the repair left behind; if a
 * layout can't be made both unique and fragment-free, the best (fewest
 * stray cells) layout found across attempts is used as a fallback.
 * @param {import('./types').Difficulty} difficulty
 * @param {number} seed
 * @returns {import('./types').Puzzle | null}
 */
export function generatePuzzle(difficulty, seed, outerAttempts = 8, repairSteps = 300) {
  const { size, complexity } = DIFFICULTY_CONFIG[difficulty];
  const rand = mulberry32(seed);
  let best = null;
  let bestStrayCount = Infinity;

  for (let attempt = 0; attempt < outerAttempts; attempt++) {
    const solution = generateSolution(size, rand);
    if (!solution) continue;

    const regions = growRegions(size, solution, complexity, rand);
    const unique = repairToUnique(regions, solution, size, rand, repairSteps);
    if (!unique) continue;

    smoothFragments(regions, solution, size, 60);
    if (countSolutions(regions, size, 2) !== 1) continue;

    const strayCount = countStrayCells(regions, solution, size);
    const puzzle = { id: `${difficulty}-${seed}-${attempt}`, size, difficulty, regions, solution };

    if (strayCount === 0) return puzzle;
    if (strayCount < bestStrayCount) {
      bestStrayCount = strayCount;
      best = puzzle;
    }
  }

  return best;
}
