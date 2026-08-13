import { useMemo, useState } from "react";
import { Crown, Loader2, Play } from "lucide-react";
import { DIFFICULTY_CONFIG, DIFFICULTY_ORDER } from "../game/constants.js";

const GRID_COLUMNS = 2;

const BLURB = {
  easy: "กระดานเล็ก ขอบเขตชัดเจน เหมาะสำหรับเริ่มต้น",
  medium: "ขนาดกลาง ต้องคิดอีกนิดหน่อย",
  hard: "ขอบเขตซับซ้อนขึ้น ท้าทายกว่าเดิม",
  expert: "กระดานใหญ่ที่สุด ต้องใช้การให้เหตุผลหลายขั้นตอน",
};

export function StartScreen({ onStart, loading }) {
  const [selected, setSelected] = useState("medium");
  const cardRefs = useMemo(() => DIFFICULTY_ORDER.map(() => ({ current: null })), []);

  function handleKeyDown(e, index) {
    let next;
    if (e.key === "ArrowRight") next = Math.min(DIFFICULTY_ORDER.length - 1, index + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, index - 1);
    else if (e.key === "ArrowDown") next = Math.min(DIFFICULTY_ORDER.length - 1, index + GRID_COLUMNS);
    else if (e.key === "ArrowUp") next = Math.max(0, index - GRID_COLUMNS);
    else return;
    e.preventDefault();
    setSelected(DIFFICULTY_ORDER[next]);
    cardRefs[next].current?.focus();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-5 py-10 text-ink-900 dark:bg-ink-900 dark:text-white">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
          <Crown className="text-white" size={30} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Queens</h1>
        <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-ink-400 dark:text-gray-400">
          วาง Queen หนึ่งตัวในทุกแถว ทุกคอลัมน์ และทุกขอบเขตสี โดยที่ Queen ห้ามสัมผัสกันในแนวทแยงมุม
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-ink-400 dark:text-gray-500">
          เลือกระดับความยาก
        </div>
        <div role="radiogroup" aria-label="เลือกระดับความยาก" className="grid grid-cols-2 gap-2.5">
          {DIFFICULTY_ORDER.map((d, index) => {
            const active = d === selected;
            const { label, size } = DIFFICULTY_CONFIG[d];
            return (
              <button
                key={d}
                ref={cardRefs[index]}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setSelected(d)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={[
                  "rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-500/10"
                    : "border-black/10 bg-white hover:border-black/20 dark:border-white/10 dark:bg-ink-800 dark:hover:border-white/20",
                ].join(" ")}
              >
                <div className={`text-[15px] font-bold ${active ? "text-brand-600 dark:text-brand-500" : ""}`}>
                  {label}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-400 dark:text-gray-500">
                  {size}×{size}
                </div>
                <div className="mt-2 text-[11.5px] leading-snug text-ink-400 dark:text-gray-500">
                  {BLURB[d]}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onStart(selected)}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              กำลังสร้างปริศนา...
            </>
          ) : (
            <>
              <Play size={18} />
              เริ่มเกม
            </>
          )}
        </button>
      </div>
    </div>
  );
}
