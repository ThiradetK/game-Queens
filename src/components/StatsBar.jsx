import { Timer } from "./Timer.jsx";
import { DIFFICULTY_CONFIG } from "../game/constants.js";

export function StatsBar({ ms, difficulty }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5 dark:bg-ink-800 dark:ring-white/10">
      <Timer ms={ms} />
      <div className="text-right">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:text-gray-500">
          ระดับความยาก
        </div>
        <div className="text-[17px] font-bold leading-none text-ink-900 dark:text-white">
          {DIFFICULTY_CONFIG[difficulty].label}
        </div>
      </div>
    </div>
  );
}
