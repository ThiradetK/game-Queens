import { Lightbulb } from "lucide-react";
import { MAX_HINTS } from "../game/constants.js";

export function HintButton({ hintsUsed, disabled, onClick }) {
  const remaining = MAX_HINTS - hintsUsed;
  const exhausted = remaining <= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || exhausted}
      className={[
        "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-colors",
        exhausted || disabled
          ? "cursor-not-allowed bg-black/5 text-ink-400 dark:bg-white/5 dark:text-gray-500"
          : "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
      ].join(" ")}
    >
      <Lightbulb size={16} />
      คำใบ้{remaining > 0 ? ` (${remaining})` : ""}
    </button>
  );
}
