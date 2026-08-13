import { ArrowLeft, CircleHelp, Settings as SettingsIcon } from "lucide-react";

const iconButtonClasses =
  "flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-black/5 active:bg-black/10 dark:text-gray-200 dark:hover:bg-white/10 dark:active:bg-white/15";

export function GameHeader({ onBack, onHelp, onSettings }) {
  return (
    <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
      <button type="button" aria-label="กลับไปเลือกระดับความยาก" className={iconButtonClasses} onClick={onBack}>
        <ArrowLeft size={20} />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-brand-500 text-[13px] font-extrabold text-white">
          in
        </div>
        <span className="text-[17px] font-bold tracking-tight text-ink-900 dark:text-white">Queens</span>
      </div>

      <div className="flex items-center">
        <button type="button" aria-label="วิธีเล่น" className={iconButtonClasses} onClick={onHelp}>
          <CircleHelp size={20} />
        </button>
        <button type="button" aria-label="ตั้งค่า" className={iconButtonClasses} onClick={onSettings}>
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  );
}
