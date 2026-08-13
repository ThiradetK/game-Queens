import { Loader2, Sparkles } from "lucide-react";
import { formatTime } from "../utils/formatTime.js";

export function CompletionModal({ elapsedMs, generating, onPlayAgain, onNextPuzzle }) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      <div className="w-full max-w-sm animate-pop-in rounded-[22px] bg-white p-7 text-center shadow-2xl dark:bg-ink-800">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
          <Sparkles className="text-white" size={28} />
        </div>
        <h2 id="completion-title" className="mb-1 text-xl font-bold text-ink-900 dark:text-white">
          ยินดีด้วย!
        </h2>
        <p className="mb-4 text-sm text-ink-400 dark:text-gray-400">คุณไขปริศนาสำเร็จแล้ว</p>
        <div className="mb-6 font-mono text-3xl font-bold tabular-nums tracking-wide text-ink-900 dark:text-white">
          {formatTime(elapsedMs)}
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            disabled={generating}
            className="flex-1 rounded-xl border border-black/10 py-2.5 text-[14px] font-semibold text-ink-900 transition-colors hover:bg-black/5 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            เล่นอีกครั้ง
          </button>
          <button
            type="button"
            onClick={onNextPuzzle}
            disabled={generating}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
          >
            {generating ? <Loader2 size={15} className="animate-spin" /> : null}
            ปริศนาถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
