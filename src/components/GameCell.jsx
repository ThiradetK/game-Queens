import React from "react";
import { QueenIcon, XMark } from "./CellMarks.jsx";

const HINT_RING_COLOR = {
  correct: "#16a34a",
  wrong: "#dc2626",
};

export const GameCell = React.memo(function GameCell({
  row,
  col,
  state,
  color,
  borderTop,
  borderLeft,
  isError,
  hintKind, // "correct" | "wrong" | null
  disabled,
  onActivate,
  cellRef,
  onKeyDown,
}) {
  const label =
    state === "queen" ? "มี Queen" : state === "marked" ? "มีเครื่องหมาย X" : "ว่าง";

  return (
    <button
      ref={cellRef}
      type="button"
      aria-label={`แถว ${row + 1} คอลัมน์ ${col + 1} ${label}`}
      disabled={disabled}
      onClick={() => onActivate(row, col)}
      onKeyDown={onKeyDown}
      className={[
        "relative flex items-center justify-center outline-none",
        "touch-manipulation select-none",
        disabled ? "cursor-default" : "cursor-pointer",
        isError || hintKind === "wrong" ? "animate-shake" : "",
      ].join(" ")}
      style={{
        backgroundColor: color,
        borderTop,
        borderLeft,
        boxShadow: hintKind ? `inset 0 0 0 3px ${HINT_RING_COLOR[hintKind]}` : undefined,
      }}
    >
      {isError && <span className="absolute inset-0 bg-red-600/25" aria-hidden="true" />}
      {hintKind === "wrong" && !isError && (
        <span className="absolute inset-0 bg-red-600/20" aria-hidden="true" />
      )}
      {hintKind === "correct" && <span className="absolute inset-0 bg-emerald-500/20" aria-hidden="true" />}
      {state === "queen" && <QueenIcon />}
      {state === "marked" && <XMark />}
    </button>
  );
});
