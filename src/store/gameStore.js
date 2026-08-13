import { useCallback, useEffect, useReducer, useState } from "react";
import { createEmptyBoard, cellKey } from "../game/puzzleUtils.js";
import { isValidQueenPlacement, isSolved } from "../game/validator.js";
import { MAX_HINTS } from "../game/constants.js";

const initialSettings = { sound: true, dark: false, animation: true };

/**
 * useGameStore's lazy initializer accepts either:
 *  - a fresh Puzzle (normal new-game path), or
 *  - a restored snapshot `{ restored: true, puzzle, board, difficulty,
 *    startTs, hintsUsed }` loaded from localStorage (see utils/storage.js),
 *    used to resume an in-progress game after a refresh.
 */
function createInitialState(init) {
  if (init && init.restored) {
    const { puzzle, board, difficulty, startTs, hintsUsed } = init;
    return {
      puzzle,
      board,
      status: "playing",
      hintsUsed,
      hint: null,
      errorCell: null,
      difficulty,
      startTs,
      finalElapsed: null,
      settings: initialSettings,
    };
  }

  const puzzle = init;
  return {
    puzzle,
    board: createEmptyBoard(puzzle.size),
    status: "playing", // "playing" | "completed"
    hintsUsed: 0,
    hint: null, // { id, cell: string|null, kind: "correct"|"wrong"|"empty", message } | null
    errorCell: null,
    difficulty: puzzle.difficulty,
    startTs: Date.now(),
    finalElapsed: null,
    settings: initialSettings,
  };
}

function findPlacedQueens(board) {
  const queens = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      if (board[r][c] === "queen") queens.push([r, c]);
    }
  }
  return queens;
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_PUZZLE": {
      const { puzzle } = action;
      return {
        ...state,
        puzzle,
        board: createEmptyBoard(puzzle.size),
        status: "playing",
        hintsUsed: 0,
        hint: null,
        errorCell: null,
        difficulty: puzzle.difficulty,
        startTs: Date.now(),
        finalElapsed: null,
      };
    }
    case "RESET": {
      return {
        ...state,
        board: createEmptyBoard(state.puzzle.size),
        status: "playing",
        hintsUsed: 0,
        hint: null,
        errorCell: null,
        startTs: Date.now(),
        finalElapsed: null,
      };
    }
    case "TOGGLE_CELL": {
      if (state.status === "completed") return state;
      const { row, col } = action;
      const board = state.board.map((r) => r.slice());
      const current = board[row][col];

      if (current === "empty") {
        board[row][col] = "marked";
        return { ...state, board, hint: null };
      }

      if (current === "marked") {
        if (isValidQueenPlacement(board, row, col, state.puzzle.regions)) {
          board[row][col] = "queen";
          const solved = isSolved(board, state.puzzle.regions);
          return {
            ...state,
            board,
            status: solved ? "completed" : state.status,
            finalElapsed: solved ? Date.now() - state.startTs : state.finalElapsed,
            hint: null,
            errorCell: null,
          };
        }
        return { ...state, errorCell: cellKey(row, col), hint: null };
      }

      if (current === "queen") {
        board[row][col] = "empty";
        return { ...state, board, hint: null };
      }

      return state;
    }
    case "CLEAR_ERROR":
      return state.errorCell === action.cell ? { ...state, errorCell: null } : state;
    case "CLEAR_HINT":
      return state.hint?.id === action.id ? { ...state, hint: null } : state;

    // Hints only ever comment on queens the player has already placed —
    // "is what I have down right or wrong" — they never add a missing
    // queen for the player. This matches how a human helper would nudge
    // you: check your work, don't do it for you.
    case "HINT": {
      if (state.status === "completed" || state.hintsUsed >= MAX_HINTS) return state;

      const id = `${Date.now()}-${Math.random()}`;
      const solutionSet = new Set(state.puzzle.solution.map((q) => cellKey(q.row, q.col)));
      const placed = findPlacedQueens(state.board);

      if (placed.length === 0) {
        // Doesn't consume a hint — it's not revealing any puzzle info.
        return {
          ...state,
          hint: { id, cell: null, kind: "empty", message: "ลองวาง Queen อย่างน้อย 1 ตัวก่อนขอคำใบ้" },
        };
      }

      const wrong = placed.find(([r, c]) => !solutionSet.has(cellKey(r, c)));
      if (wrong) {
        const [r, c] = wrong;
        return {
          ...state,
          hintsUsed: state.hintsUsed + 1,
          hint: {
            id,
            cell: cellKey(r, c),
            kind: "wrong",
            message: `Queen ที่แถว ${r + 1} คอลัมน์ ${c + 1} วางผิดตำแหน่ง`,
          },
        };
      }

      const [r, c] = placed[placed.length - 1];
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hint: {
          id,
          cell: cellKey(r, c),
          kind: "correct",
          message: "ที่วางไว้ถูกต้องแล้ว ลองวางตัวถัดไปได้เลย",
        },
      };
    }
    case "TOGGLE_SETTING":
      return { ...state, settings: { ...state.settings, [action.key]: !state.settings[action.key] } };
    default:
      return state;
  }
}

/**
 * Timer reads elapsed time from a start timestamp. `Date.now()` is only
 * ever called inside the effect/interval callback (never during render,
 * which must stay pure) — the 1s tick commits the computed value to state
 * so the displayed MM:SS advances without re-rendering every frame.
 */
function useElapsedTime(startTs, running) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running || !startTs) return undefined;
    const tick = () => setElapsed(Date.now() - startTs);
    const immediate = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(id);
    };
  }, [running, startTs]);
  return running ? elapsed : 0;
}

export function useGameStore(init) {
  const [state, dispatch] = useReducer(reducer, init, createInitialState);

  const elapsedLive = useElapsedTime(state.startTs, state.status === "playing");
  const displayedMs = state.status === "completed" ? state.finalElapsed ?? 0 : elapsedLive;

  // Auto-clear transient error / hint highlights.
  useEffect(() => {
    if (!state.errorCell) return undefined;
    const id = setTimeout(() => dispatch({ type: "CLEAR_ERROR", cell: state.errorCell }), 380);
    return () => clearTimeout(id);
  }, [state.errorCell]);

  useEffect(() => {
    if (!state.hint) return undefined;
    const id = setTimeout(() => dispatch({ type: "CLEAR_HINT", id: state.hint.id }), 2600);
    return () => clearTimeout(id);
  }, [state.hint]);

  const toggleCell = useCallback((row, col) => dispatch({ type: "TOGGLE_CELL", row, col }), []);
  const resetGame = useCallback(() => dispatch({ type: "RESET" }), []);
  const loadPuzzle = useCallback((puzzle) => dispatch({ type: "LOAD_PUZZLE", puzzle }), []);
  const useHint = useCallback(() => dispatch({ type: "HINT" }), []);
  const toggleSetting = useCallback((key) => dispatch({ type: "TOGGLE_SETTING", key }), []);

  return {
    ...state,
    displayedMs,
    toggleCell,
    resetGame,
    loadPuzzle,
    useHint,
    toggleSetting,
  };
}
