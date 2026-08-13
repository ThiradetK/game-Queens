import { formatTime } from "../utils/formatTime.js";

export function Timer({ ms }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:text-gray-500">
        เวลา
      </div>
      <div className="font-mono text-[26px] font-bold tabular-nums leading-none text-ink-900 dark:text-white">
        {formatTime(ms)}
      </div>
    </div>
  );
}
