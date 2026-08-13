import { ChevronDown, ChevronUp } from "lucide-react";

const STEPS = [
  "เป้าหมายของคุณคือการมี Queen หนึ่งตัวในแต่ละแถว คอลัมน์ และขอบเขตสี",
  "แตะหนึ่งครั้งเพื่อวาง X และแตะอีกครั้งเพื่อวาง Queen",
  "Queen สองตัวไม่สามารถสัมผัสกันได้ แม้แต่ในแนวทแยงมุม",
  "เมื่อวาง Queen ครบทุกเงื่อนไข เกมจะถือว่าชนะ",
];

export function HowToPlay({ open, onToggle }) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={[
          "flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-[14px] font-semibold text-ink-900 shadow-sm ring-1 ring-black/5 transition-colors dark:bg-ink-800 dark:text-white dark:ring-white/10",
          open ? "rounded-b-none" : "",
        ].join(" ")}
      >
        วิธีการเล่น
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <ol className="animate-fade-in list-decimal space-y-2 rounded-b-2xl bg-ink-50 px-8 py-4 text-[13.5px] leading-relaxed text-ink-700 ring-1 ring-black/5 dark:bg-ink-900/60 dark:text-gray-300 dark:ring-white/10">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
