import { RotateCcw, Shuffle, Loader2 } from "lucide-react";
import { HintButton } from "./HintButton.jsx";

const secondaryButtonClasses =
  "flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3 text-[14px] font-semibold text-ink-900 transition-colors hover:bg-black/5 active:bg-black/10 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:hover:bg-white/5";

export function GameControls({ hintsUsed, gameCompleted, generating, onReset, onHint, onNewPuzzle }) {
  return (
    <div className="mt-4 flex gap-2.5">
      <button type="button" onClick={onReset} disabled={generating} className={`flex-1 ${secondaryButtonClasses}`}>
        <RotateCcw size={16} />
        รีเซ็ต
      </button>

      <HintButton hintsUsed={hintsUsed} disabled={gameCompleted || generating} onClick={onHint} />

      <button
        type="button"
        onClick={onNewPuzzle}
        disabled={generating}
        aria-label="ปริศนาใหม่"
        className={`w-12 shrink-0 ${secondaryButtonClasses}`}
      >
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={16} />}
      </button>
    </div>
  );
}
