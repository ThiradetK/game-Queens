import { DIFFICULTY_CONFIG, DIFFICULTY_ORDER } from "../game/constants.js";

export function DifficultySelector({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="ระดับความยาก"
      className="grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5"
    >
      {DIFFICULTY_ORDER.map((d) => {
        const active = d === value;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d)}
            className={[
              "rounded-lg px-2 py-1.5 text-[12.5px] font-semibold transition-all",
              active
                ? "bg-white text-ink-900 shadow-sm dark:bg-ink-700 dark:text-white"
                : "text-ink-400 hover:text-ink-700 dark:text-gray-400 dark:hover:text-gray-200",
            ].join(" ")}
          >
            {DIFFICULTY_CONFIG[d].label}
          </button>
        );
      })}
    </div>
  );
}
