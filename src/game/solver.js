/**
 * Counts solutions to a region map (up to `limit`, so generation can stop
 * early once it knows a puzzle is not unique). Uses the same
 * diagonal-adjacency-only rule as the interactive validator.
 * @param {number[][]} regions
 * @param {number} size
 * @param {number} limit
 */
export function countSolutions(regions, size, limit = 2) {
  let count = 0;
  const usedCols = new Set();
  const usedRegions = new Set();
  const colOf = new Array(size).fill(-1);

  function backtrack(row) {
    if (count >= limit) return;
    if (row === size) {
      count++;
      return;
    }
    for (let col = 0; col < size; col++) {
      if (usedCols.has(col)) continue;
      const regionId = regions[row][col];
      if (usedRegions.has(regionId)) continue;
      if (row > 0 && colOf[row - 1] !== -1 && Math.abs(col - colOf[row - 1]) === 1) continue;

      usedCols.add(col);
      usedRegions.add(regionId);
      colOf[row] = col;

      backtrack(row + 1);

      usedCols.delete(col);
      usedRegions.delete(regionId);
      colOf[row] = -1;
      if (count >= limit) return;
    }
  }

  backtrack(0);
  return count;
}

/** Finds up to `cap` full solutions, returned as arrays of columns (index = row). */
export function findSolutions(regions, size, cap) {
  const results = [];
  const usedCols = new Set();
  const usedRegions = new Set();
  const colOf = new Array(size).fill(-1);

  function backtrack(row) {
    if (results.length >= cap) return;
    if (row === size) {
      results.push(colOf.slice());
      return;
    }
    for (let col = 0; col < size; col++) {
      if (usedCols.has(col)) continue;
      const regionId = regions[row][col];
      if (usedRegions.has(regionId)) continue;
      if (row > 0 && colOf[row - 1] !== -1 && Math.abs(col - colOf[row - 1]) === 1) continue;

      usedCols.add(col);
      usedRegions.add(regionId);
      colOf[row] = col;

      backtrack(row + 1);

      usedCols.delete(col);
      usedRegions.delete(regionId);
      colOf[row] = -1;
      if (results.length >= cap) return;
    }
  }

  backtrack(0);
  return results;
}

/** Finds a single solution (used for solvability checks / tooling). */
export function solve(regions, size) {
  const usedCols = new Set();
  const usedRegions = new Set();
  const colOf = new Array(size).fill(-1);
  let result = null;

  function backtrack(row) {
    if (result) return;
    if (row === size) {
      result = colOf.map((col, r) => ({ row: r, col }));
      return;
    }
    for (let col = 0; col < size; col++) {
      if (usedCols.has(col)) continue;
      const regionId = regions[row][col];
      if (usedRegions.has(regionId)) continue;
      if (row > 0 && colOf[row - 1] !== -1 && Math.abs(col - colOf[row - 1]) === 1) continue;

      usedCols.add(col);
      usedRegions.add(regionId);
      colOf[row] = col;

      backtrack(row + 1);

      usedCols.delete(col);
      usedRegions.delete(regionId);
      colOf[row] = -1;
      if (result) return;
    }
  }

  backtrack(0);
  return result;
}
