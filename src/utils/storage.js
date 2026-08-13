const STORAGE_KEY = "queens-game-state";
const STORAGE_VERSION = 1;

/**
 * Persists just enough to resume an in-progress puzzle after a refresh:
 * the puzzle itself (regions/solution), the board, hint count, difficulty,
 * and the original start timestamp (kept as-is, not an "elapsed at save"
 * snapshot — so the timer honestly reflects real time passed, matching how
 * the reference game behaves if you leave and come back).
 *
 * Deliberately NOT persisted: completed games (nothing to resume) and
 * transient UI state (hint/error highlight flashes).
 *
 * All operations fail silently (private browsing, quota exceeded, storage
 * disabled, SSR, corrupted data) — persistence is a nice-to-have, never a
 * hard requirement for the game to function.
 */
export function saveGame(snapshot) {
  try {
    const payload = JSON.stringify({ version: STORAGE_VERSION, ...snapshot });
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) return null;
    if (!isValidSnapshot(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSavedGame() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

function isValidSnapshot(data) {
  const { puzzle, board, difficulty, startTs, hintsUsed } = data;
  if (!puzzle || typeof puzzle.size !== "number") return false;
  if (!Array.isArray(puzzle.regions) || puzzle.regions.length !== puzzle.size) return false;
  if (!Array.isArray(puzzle.solution) || puzzle.solution.length !== puzzle.size) return false;
  if (!Array.isArray(board) || board.length !== puzzle.size) return false;
  if (!board.every((row) => Array.isArray(row) && row.length === puzzle.size)) return false;
  if (typeof difficulty !== "string") return false;
  if (typeof startTs !== "number") return false;
  if (typeof hintsUsed !== "number") return false;
  return true;
}
