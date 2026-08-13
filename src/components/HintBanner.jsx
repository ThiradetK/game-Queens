import { CheckCircle2, XCircle, Info } from "lucide-react";

const STYLES = {
  correct: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  wrong: {
    icon: XCircle,
    classes: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
  },
  empty: {
    icon: Info,
    classes: "bg-black/5 text-ink-700 ring-black/10 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
  },
};

export function HintBanner({ hint }) {
  if (!hint) return null;
  const { icon: Icon, classes } = STYLES[hint.kind] ?? STYLES.empty;

  return (
    <div
      role="status"
      className={`mt-3 flex animate-fade-in items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium ring-1 ${classes}`}
    >
      <Icon size={16} className="shrink-0" />
      <span>{hint.message}</span>
    </div>
  );
}
