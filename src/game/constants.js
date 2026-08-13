export const REGION_COLORS = [
  "#F3B6D2",
  "#F7C99B",
  "#A9C9F5",
  "#B7E3A8",
  "#F29489",
  "#D6D6D6",
  "#EAF08A",
  "#C7B4E8",
  "#D8CBB0",
  "#8FD8D2",
  "#F5A9C8",
  "#B0C4DE",
];

/** @type {Record<import('./types').Difficulty, {label: string, size: number, complexity: number}>} */
export const DIFFICULTY_CONFIG = {
  easy: { label: "ง่าย", size: 6, complexity: 0.22 },
  medium: { label: "ปานกลาง", size: 7, complexity: 0.45 },
  hard: { label: "ยาก", size: 8, complexity: 0.68 },
  expert: { label: "ยากมาก", size: 9, complexity: 0.9 },
};

export const DIFFICULTY_ORDER = ["easy", "medium", "hard", "expert"];

export const MAX_HINTS = 3;
