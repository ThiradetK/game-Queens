const DIAGONAL_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/**
 * Queens only conflict when directly diagonally ADJACENT — this is
 * intentionally different from the classic N-Queens "shares a diagonal" rule.
 */
export function isDiagonallyAdjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1;
}

/**
 * Checks whether placing a queen at (row, col) is legal given the current
 * board and region map. Does not mutate the board.
 * @param {import('./types').Board} board
 * @param {number} row
 * @param {number} col
 * @param {number[][]} regions
 */
export function isValidQueenPlacement(board, row, col, regions) {
  const size = board.length;

  for (let c = 0; c < size; c++) {
    if (board[row][c] === "queen") return false;
  }
  for (let r = 0; r < size; r++) {
    if (board[r][col] === "queen") return false;
  }

  const regionId = regions[row][col];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === regionId && board[r][c] === "queen") return false;
    }
  }

  for (const [dr, dc] of DIAGONAL_DIRS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === "queen") {
      return false;
    }
  }

  return true;
}

/**
 * Returns true only when every row, column, and region has exactly one
 * queen and no two queens are diagonally adjacent.
 * @param {import('./types').Board} board
 * @param {number[][]} regions
 */
export function isSolved(board, regions) {
  const size = board.length;
  const rowCount = new Array(size).fill(0);
  const colCount = new Array(size).fill(0);
  const regionCount = {};
  const queens = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === "queen") {
        rowCount[r]++;
        colCount[c]++;
        const rid = regions[r][c];
        regionCount[rid] = (regionCount[rid] || 0) + 1;
        queens.push([r, c]);
      }
    }
  }

  if (queens.length !== size) return false;
  if (rowCount.some((x) => x !== 1)) return false;
  if (colCount.some((x) => x !== 1)) return false;
  if (Object.keys(regionCount).length !== size) return false;
  if (Object.values(regionCount).some((x) => x !== 1)) return false;

  for (const [r, c] of queens) {
    for (const [dr, dc] of DIAGONAL_DIRS) {
      if (board[r + dr]?.[c + dc] === "queen") return false;
    }
  }

  return true;
}
