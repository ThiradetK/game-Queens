import { useEffect } from "react";
import { Moon, Sparkles, Sun, Volume2, VolumeX, X } from "lucide-react";

function SettingRow({ icon, label, active, onClick, isLast }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between py-3.5 text-left text-[14px] text-ink-900 dark:text-white",
        isLast ? "" : "border-b border-black/5 dark:border-white/10",
      ].join(" ")}
    >
      <span className="flex items-center gap-2.5 text-ink-700 dark:text-gray-200">
        {icon}
        {label}
      </span>
      <span
        aria-hidden="true"
        className={[
          "relative h-[22px] w-10 rounded-full transition-colors",
          active ? "bg-brand-500" : "bg-black/15 dark:bg-white/15",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all",
            active ? "left-[20px]" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export function SettingsModal({ settings, onToggle, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-slide-up rounded-t-[22px] bg-white px-5 pb-7 pt-3 shadow-2xl sm:rounded-[22px] sm:pt-5 dark:bg-ink-800"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-black/10 sm:hidden dark:bg-white/15" />
        <div className="mb-1 flex items-center justify-between">
          <h3 id="settings-title" className="text-[15px] font-bold text-ink-900 dark:text-white">
            การตั้งค่า
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-black/5 hover:text-ink-700 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <X size={17} />
          </button>
        </div>
        <div>
          <SettingRow
            icon={settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            label="เสียง"
            active={settings.sound}
            onClick={() => onToggle("sound")}
          />
          <SettingRow
            icon={settings.dark ? <Moon size={18} /> : <Sun size={18} />}
            label="โหมดมืด"
            active={settings.dark}
            onClick={() => onToggle("dark")}
          />
          <SettingRow
            icon={<Sparkles size={18} />}
            label="แอนิเมชัน"
            active={settings.animation}
            onClick={() => onToggle("animation")}
            isLast
          />
        </div>
      </div>
    </div>
  );
}
