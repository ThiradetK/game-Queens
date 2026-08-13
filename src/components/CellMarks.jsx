export function QueenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[60%] w-[60%] animate-queen-in drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="queenGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8DFA0" />
          <stop offset="100%" stopColor="#C6912F" />
        </linearGradient>
      </defs>
      <path
        fill="url(#queenGold)"
        stroke="#8a6414"
        strokeWidth="0.6"
        strokeLinejoin="round"
        d="M4 19h16l-1 2H5l-1-2Zm1.2-2h13.6l.8-6.4-3.6 2.4-3-4.6-3 4.6-3.6-2.4.8 6.4Z"
      />
      <circle cx="4" cy="9.5" r="1.4" fill="url(#queenGold)" stroke="#8a6414" strokeWidth="0.5" />
      <circle cx="12" cy="6.2" r="1.5" fill="url(#queenGold)" stroke="#8a6414" strokeWidth="0.5" />
      <circle cx="20" cy="9.5" r="1.4" fill="url(#queenGold)" stroke="#8a6414" strokeWidth="0.5" />
    </svg>
  );
}

export function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[38%] w-[38%] animate-x-in" aria-hidden="true">
      <path d="M5 5L19 19M19 5L5 19" stroke="#54595e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
