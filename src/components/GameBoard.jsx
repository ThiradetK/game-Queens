import { useMemo } from "react";
import { REGION_COLORS } from "../game/constants.js";
import { cellKey } from "../game/puzzleUtils.js";
import { GameCell } from "./GameCell.jsx";

export function GameBoard({ puzzle, board, errorCell, hint, status, onActivate }) {
  const size = puzzle.size;

  // Plain (non-React-ref) holder objects, one per cell, used only inside
  // event handlers for keyboard navigation — never read during render.
  const cellRefs = useMemo(
    () => Array.from({ length: size * size }, () => ({ current: null })),
    [size]
  );

  function focusCell(row, col) {
    cellRefs[row * size + col]?.current?.focus();
  }

  function handleKeyDown(e, row, col) {
    let nr = row;
    let nc = col;
    if (e.key === "ArrowUp") nr = Math.max(0, row - 1);
    else if (e.key === "ArrowDown") nr = Math.min(size - 1, row + 1);
    else if (e.key === "ArrowLeft") nc = Math.max(0, col - 1);
    else if (e.key === "ArrowRight") nc = Math.min(size - 1, col + 1);
    else return;
    e.preventDefault();
    focusCell(nr, nc);
  }

  return (
    <div
      role="grid"
      aria-label="กระดานปริศนา Queens"
      className="mx-auto grid overflow-hidden rounded-2xl border-[3px] border-ink-900 shadow-lg shadow-black/10 dark:border-black dark:shadow-black/40"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
        width: "min(100%, 560px)",
        aspectRatio: "1 / 1",
      }}
    >
      {board.map((rowArr, r) =>
        rowArr.map((cellState, c) => {
          const regionId = puzzle.regions[r][c];
          const color = REGION_COLORS[regionId % REGION_COLORS.length];
          const differsTop = r === 0 || puzzle.regions[r - 1][c] !== regionId;
          const differsLeft = c === 0 || puzzle.regions[r][c - 1] !== regionId;
          const key = cellKey(r, c);

          return (
            <GameCell
              key={key}
              cellRef={cellRefs[r * size + c]}
              row={r}
              col={c}
              state={cellState}
              color={color}
              borderTop={differsTop ? "2px solid #26282b" : "1px solid rgba(0,0,0,0.08)"}
              borderLeft={differsLeft ? "2px solid #26282b" : "1px solid rgba(0,0,0,0.08)"}
              isError={errorCell === key}
              hintKind={hint?.cell === key ? hint.kind : null}
              disabled={status === "completed"}
              onActivate={onActivate}
              onKeyDown={(e) => handleKeyDown(e, r, c)}
            />
          );
        })
      )}
    </div>
  );
}
