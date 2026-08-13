import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errors = [];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function click(el) {
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

// --- 1. Build a minimal DOM + wire jsdom globals onto the real Node global ---
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const { window } = dom;

window.onerror = (msg) => errors.push(`window.onerror: ${msg}`);
window.addEventListener("unhandledrejection", (e) => errors.push(`unhandledrejection: ${e.reason}`));

global.window = window;
global.document = window.document;
window.__QUEENS_EXPOSE_PUZZLE__ = true;
try {
  global.navigator = window.navigator;
} catch {
  /* Node 21+ defines a read-only global.navigator; keep Node's version */
}
try {
  global.self = window;
} catch {
  /* ignore */
}
for (const name of Object.getOwnPropertyNames(window)) {
  if (name in global) continue;
  try {
    global[name] = window[name];
  } catch {
    /* some getters throw on access (e.g. window.frameElement) — ignore */
  }
}

const origConsoleError = console.error;
console.error = (...args) => {
  errors.push(`console.error: ${args.map(String).join(" ")}`);
  origConsoleError(...args);
};

// --- 2. Import the real built bundle so it actually executes (module scripts don't run via jsdom's HTML parser) ---
const distDir = path.join(__dirname, "dist");
const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
if (!jsMatch) throw new Error("could not find built JS entry in dist/index.html");
const jsPath = path.join(distDir, jsMatch[1]);

await import(pathToFileURL(jsPath).href);
await sleep(600); // let React mount + first puzzle generate

const doc = document;
console.log("root has children after mount:", doc.getElementById("root").children.length > 0);

// --- 3. Start screen: 4 difficulty cards, pick "easy", start ---
let radios = doc.querySelectorAll('[role="radio"]');
console.log("difficulty cards found:", radios.length);
if (radios.length !== 4) errors.push(`expected 4 difficulty cards, found ${radios.length}`);

click(radios[0]);
await sleep(30);

let startBtn = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("เริ่มเกม"));
if (!startBtn) errors.push("start button not found");
else click(startBtn);

await sleep(700);

// --- 4. Game screen should now show a board ---
const grid = doc.querySelector('[role="grid"]');
if (!grid) errors.push("game board grid not found after starting");
const cells = grid ? [...grid.querySelectorAll("button")] : [];
console.log("board mounted, cell count:", cells.length, "(size", Math.sqrt(cells.length), ")");

// --- 5. Interaction cycle: empty -> X -> Queen -> empty ---
const c0 = cells[0];
click(c0);
await sleep(20);
console.log("cell0 after 1 click:", c0.getAttribute("aria-label"));
if (!c0.getAttribute("aria-label")?.includes("เครื่องหมาย X")) errors.push("1st click did not produce an X");

click(c0);
await sleep(20);
console.log("cell0 after 2 clicks:", c0.getAttribute("aria-label"));
if (!c0.getAttribute("aria-label")?.includes("Queen")) errors.push("2nd click did not place a queen");

click(c0);
await sleep(20);
console.log("cell0 after 3 clicks:", c0.getAttribute("aria-label"));
if (!c0.getAttribute("aria-label")?.endsWith("ว่าง")) errors.push("3rd click did not clear back to empty");

// --- 6. Hint with nothing placed -> nudge message, no queen added ---
const hintBtn = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("คำใบ้"));
if (!hintBtn) errors.push("hint button not found");
else {
  click(hintBtn);
  await sleep(40);
  const banner = doc.querySelector('[role="status"]');
  console.log("hint banner text (empty board):", banner ? banner.textContent : "(none)");
  if (!banner || !banner.textContent.includes("วาง Queen")) {
    errors.push("hint on empty board did not show the expected nudge");
  }
  const queenCount = cells.filter((c) => c.getAttribute("aria-label")?.includes("มี Queen")).length;
  if (queenCount !== 0) errors.push(`hint on empty board should not place a queen, found ${queenCount}`);
}

// --- 7. Place a deliberately WRONG queen, then verify hint flags it (not auto-fixes it) ---
click(cells[0]); // -> X
await sleep(15);
click(cells[0]); // -> queen (row0, col0)
await sleep(15);
if (hintBtn) {
  click(hintBtn);
  await sleep(40);
  const banner = doc.querySelector('[role="status"]');
  console.log("hint banner text (1 queen placed):", banner ? banner.textContent : "(none)");
  const stillOneQueen = cells.filter((c) => c.getAttribute("aria-label")?.includes("มี Queen")).length === 1;
  if (!stillOneQueen) errors.push("hint changed the number of queens on the board — it must never place/move queens");
}

// --- 8. Reset shouldn't throw, and should clear the board ---
const resetBtn = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("รีเซ็ต"));
if (!resetBtn) errors.push("reset button not found");
else {
  click(resetBtn);
  await sleep(30);
  const anyQueenOrX = cells.some((c) => {
    const l = c.getAttribute("aria-label") || "";
    return l.includes("Queen") || l.includes("เครื่องหมาย X");
  });
  if (anyQueenOrX) errors.push("reset did not clear the board");
  else console.log("reset correctly cleared the board");
}

// --- 9. Back button returns to the start screen ---
const backBtn = doc.querySelector('[aria-label="กลับไปเลือกระดับความยาก"]');
if (!backBtn) errors.push("back button not found");
else {
  click(backBtn);
  await sleep(30);
  radios = doc.querySelectorAll('[role="radio"]');
  if (radios.length !== 4) errors.push("back button did not return to the start screen");
  else console.log("back button correctly returned to start screen");
}

// --- 10. Start a NEW (different-size) difficulty, ensure the board rebuilds cleanly ---
click(radios[3]); // "expert"
await sleep(30);
startBtn = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("เริ่มเกม"));
click(startBtn);
await sleep(1200); // expert can take longer to generate

const grid2 = doc.querySelector('[role="grid"]');
const cells2 = grid2 ? [...grid2.querySelectorAll("button")] : [];
console.log("expert board cell count:", cells2.length, "(size", Math.sqrt(cells2.length), ")");
if (Math.sqrt(cells2.length) !== 9) errors.push(`expert board should be 9x9, got size ${Math.sqrt(cells2.length)}`);

// --- 11. Settings modal: dark mode toggle actually applies ---
const settingsBtn = doc.querySelector('[aria-label="ตั้งค่า"]');
if (!settingsBtn) errors.push("settings button not found");
else {
  click(settingsBtn);
  await sleep(30);
  const darkToggle = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("โหมดมืด"));
  if (!darkToggle) errors.push("dark mode toggle not found");
  else {
    click(darkToggle);
    await sleep(30);
    const isDark = doc.documentElement.classList.contains("dark");
    console.log("dark class applied after toggle:", isDark);
    if (!isDark) errors.push("dark mode toggle did not add .dark to <html>");
  }

  const animToggle = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("แอนิเมชัน"));
  if (!animToggle) errors.push("animation toggle not found in settings");
  else {
    click(animToggle); // turn OFF (was on by default)
    await sleep(30);
    const isReduced = doc.documentElement.classList.contains("motion-reduced");
    console.log("motion-reduced class applied after turning animation off:", isReduced);
    if (!isReduced) errors.push("animation toggle did not add .motion-reduced to <html> — dead setting");
  }
}

// --- 12. Keyboard navigation: ArrowRight should move focus to next cell ---
const grid3 = doc.querySelector('[role="grid"]');
const cells3 = grid3 ? [...grid3.querySelectorAll("button")] : [];
if (cells3.length > 1) {
  cells3[0].focus();
  cells3[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  await sleep(20);
  console.log("active element after ArrowRight is cell index 1:", doc.activeElement === cells3[1]);
  if (doc.activeElement !== cells3[1]) errors.push("ArrowRight keyboard navigation did not move focus to the next cell");
}

// --- 13. Hint quota: 3 "wrong" hints should exhaust it and disable the button ---
{
  const gridN = doc.querySelector('[role="grid"]');
  const cellsN = gridN ? [...gridN.querySelectorAll("button")] : [];
  const hintBtnN = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("คำใบ้"));
  const target = cellsN[0];

  for (let i = 0; i < 3; i++) {
    click(target); // -> X
    await sleep(15);
    click(target); // -> queen (wrong, most likely, for an arbitrary cell)
    await sleep(15);
    click(hintBtnN);
    await sleep(30);
    click(target); // queen -> empty, ready for next round
    await sleep(15);
  }

  await sleep(30);
  const stillClickable = !hintBtnN.disabled;
  console.log("hint button disabled after 3 consumed hints:", hintBtnN.disabled);
  if (stillClickable) {
    // It's possible one of the 3 placements happened to be the *correct*
    // solution queen for that row (also consumes a hint) or landed back on
    // an "empty board" nudge (does NOT consume) — only flag a real problem
    // if the remaining-count badge shows the hint should be exhausted.
    const label = hintBtnN.textContent;
    console.log("hint button label:", label);
    if (label.includes("(0)") || !/\(\d\)/.test(label)) {
      // count reached 0 but button still enabled — that IS a bug
      if (!hintBtnN.disabled) errors.push("hint button not disabled once remaining count reached 0");
    }
  }
}

// --- 14. Full win flow: place the real solution via actual clicks and verify completion ---
{
  const backBtnN = doc.querySelector('[aria-label="กลับไปเลือกระดับความยาก"]');
  click(backBtnN);
  await sleep(30);
  const radiosN = doc.querySelectorAll('[role="radio"]');
  click(radiosN[0]); // easy — fastest to solve
  await sleep(30);
  const startBtnN = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("เริ่มเกม"));
  click(startBtnN);
  await sleep(500);

  const puzzle = window.__QUEENS_CURRENT_PUZZLE__;
  if (!puzzle) {
    errors.push("test hook did not expose the current puzzle — cannot verify win flow");
  } else {
    console.log(`solving a real ${puzzle.size}x${puzzle.size} ${puzzle.difficulty} puzzle via clicks...`);
    const gridN = doc.querySelector('[role="grid"]');
    const cellsN = [...gridN.querySelectorAll("button")];
    const size = puzzle.size;

    for (const { row, col } of puzzle.solution) {
      const cell = cellsN[row * size + col];
      click(cell); // -> X
      await sleep(10);
      click(cell); // -> queen
      await sleep(10);
      const label = cell.getAttribute("aria-label") || "";
      if (!label.includes("Queen")) {
        errors.push(`placing solution queen at (${row},${col}) failed — got "${label}"`);
      }
    }

    await sleep(80);
    const modalTitle = [...doc.querySelectorAll("h2")].find((h) => h.textContent.includes("ยินดีด้วย"));
    console.log("completion modal appeared:", !!modalTitle);
    if (!modalTitle) errors.push("completing the real solution did not show the completion modal");

    // Board should now be locked (buttons disabled) — clicking must not change state.
    const anyEnabled = cellsN.some((c) => !c.disabled);
    console.log("all cells disabled after completion:", !anyEnabled);
    if (anyEnabled) errors.push("board cells are not disabled after the puzzle is completed");
  }
}

// --- 15. "New Puzzle" must never repeat — generate fresh every click ---
{
  const shuffleBtn = doc.querySelector('[aria-label="ปริศนาใหม่"]');
  if (!shuffleBtn) {
    errors.push("new-puzzle (shuffle) button not found");
  } else {
    const seenIds = new Set();
    const seenRegionSnapshots = new Set();
    const initial = window.__QUEENS_CURRENT_PUZZLE__;
    if (initial) {
      seenIds.add(initial.id);
      seenRegionSnapshots.add(JSON.stringify(initial.regions));
    }

    const clicks = 6;
    for (let i = 0; i < clicks; i++) {
      click(shuffleBtn);
      await sleep(120); // generation is deferred behind a spinner (setTimeout 30ms) + generation time
      const p = window.__QUEENS_CURRENT_PUZZLE__;
      if (!p) {
        errors.push(`new-puzzle click ${i}: test hook did not expose a puzzle`);
        continue;
      }
      if (seenIds.has(p.id)) errors.push(`new-puzzle click ${i}: repeated puzzle id ${p.id}`);
      const snapshot = JSON.stringify(p.regions);
      if (seenRegionSnapshots.has(snapshot)) errors.push(`new-puzzle click ${i}: repeated region layout (identical board)`);
      seenIds.add(p.id);
      seenRegionSnapshots.add(snapshot);
    }
    console.log(`new-puzzle: ${seenIds.size} distinct puzzle ids across ${clicks + 1} loads (1 initial + ${clicks} clicks)`);
    if (seenIds.size !== clicks + 1) errors.push("new-puzzle produced fewer distinct puzzles than clicks — repetition detected");
  }
}

// --- 16. Refresh-resume: partially solve a puzzle, simulate a real page
//     reload (fresh JSDOM window + fresh module import, pre-seeded with
//     the localStorage this session wrote), and verify it resumes straight
//     into the same in-progress board instead of the start screen.
{
  // Get to a clean mid-game state on a fresh puzzle.
  const backBtnN = doc.querySelector('[aria-label="กลับไปเลือกระดับความยาก"]');
  click(backBtnN);
  await sleep(30);
  let radiosN = doc.querySelectorAll('[role="radio"]');
  click(radiosN[0]); // easy
  await sleep(30);
  let startBtnN = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("เริ่มเกม"));
  click(startBtnN);
  await sleep(500);

  const puzzleBefore = window.__QUEENS_CURRENT_PUZZLE__;
  const gridBefore = doc.querySelector('[role="grid"]');
  const cellsBefore = [...gridBefore.querySelectorAll("button")];
  const size = puzzleBefore.size;

  // Place the first TWO solution queens (partial, deliberately unsolved progress).
  const partial = puzzleBefore.solution.slice(0, 2);
  for (const { row, col } of partial) {
    const cell = cellsBefore[row * size + col];
    click(cell);
    await sleep(10);
    click(cell);
    await sleep(10);
  }
  // Also use a hint once, so hintsUsed persistence is exercised too.
  const hintBtnN = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("คำใบ้"));
  click(hintBtnN);
  await sleep(40);

  await sleep(50);
  const savedRaw = window.localStorage.getItem("queens-game-state");
  console.log("localStorage has a saved entry after partial progress:", !!savedRaw);
  if (!savedRaw) {
    errors.push("no localStorage entry found after making progress on a puzzle");
  } else {
    const saved = JSON.parse(savedRaw);
    if (saved.puzzle?.id !== puzzleBefore.id) errors.push("saved puzzle id doesn't match the puzzle being played");
    if (saved.hintsUsed !== 1) errors.push(`expected hintsUsed=1 in saved state, got ${saved.hintsUsed}`);
    const savedQueenCount = saved.board.flat().filter((s) => s === "queen").length;
    if (savedQueenCount < 2) errors.push(`expected at least 2 queens in saved board, found ${savedQueenCount}`);

    // --- Simulate an actual page reload: brand new window/document, with
    //     localStorage pre-populated exactly as a real refresh would find it.
    const dom2 = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
      url: "http://localhost/",
      pretendToBeVisual: true,
    });
    const window2 = dom2.window;
    window2.localStorage.setItem("queens-game-state", savedRaw);
    window2.onerror = (msg) => errors.push(`[reload] window.onerror: ${msg}`);
    window2.addEventListener("unhandledrejection", (e) => errors.push(`[reload] unhandledrejection: ${e.reason}`));

    global.window = window2;
    global.document = window2.document;
    window2.__QUEENS_EXPOSE_PUZZLE__ = true;
    for (const name of Object.getOwnPropertyNames(window2)) {
      if (name in global) continue;
      try {
        global[name] = window2[name];
      } catch {
        /* ignore getters that throw */
      }
    }

    // Cache-bust so Node actually re-evaluates the module instead of
    // returning the already-imported instance for this exact file path.
    await import(`${pathToFileURL(jsPath).href}?reload=${Date.now()}`);
    await sleep(500);

    const doc2 = window2.document;
    const gridAfter = doc2.querySelector('[role="grid"]');
    const startScreenAfter = doc2.querySelectorAll('[role="radio"]');
    console.log("after simulated reload: game board present:", !!gridAfter, "| start screen present:", startScreenAfter.length > 0);
    if (!gridAfter) errors.push("reload did not resume into the game board");
    if (startScreenAfter.length > 0) errors.push("reload showed the start screen instead of resuming");

    if (gridAfter) {
      const cellsAfter = [...gridAfter.querySelectorAll("button")];
      const queenCountAfter = cellsAfter.filter((c) => c.getAttribute("aria-label")?.includes("มี Queen")).length;
      console.log("queens present after reload:", queenCountAfter, "(expected >= 2)");
      if (queenCountAfter < 2) errors.push(`resumed board has ${queenCountAfter} queens, expected the 2 placed before reload`);

      const puzzleAfter = window2.__QUEENS_CURRENT_PUZZLE__;
      if (puzzleAfter?.id !== puzzleBefore.id) errors.push("resumed puzzle id doesn't match the one saved before reload");

      const hintBtnAfter = [...doc2.querySelectorAll("button")].find((b) => b.textContent.includes("คำใบ้"));
      console.log("hint button label after reload (should show 2 remaining):", hintBtnAfter?.textContent);
      if (!hintBtnAfter?.textContent.includes("(2)")) errors.push("hintsUsed did not survive the reload correctly");
    }
    window2.close();

    // Restore globals to the original window before continuing further tests.
    global.window = window;
    global.document = window.document;
  }
}

// --- 17. Completing a puzzle must clear the saved entry (nothing to resume) ---
{
  const backBtnN = doc.querySelector('[aria-label="กลับไปเลือกระดับความยาก"]');
  click(backBtnN);
  await sleep(30);
  const radiosN = doc.querySelectorAll('[role="radio"]');
  click(radiosN[0]); // easy
  await sleep(30);
  const startBtnN = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("เริ่มเกม"));
  click(startBtnN);
  await sleep(500);

  const puzzle = window.__QUEENS_CURRENT_PUZZLE__;
  const gridN = doc.querySelector('[role="grid"]');
  const cellsN = [...gridN.querySelectorAll("button")];
  const size = puzzle.size;

  for (const { row, col } of puzzle.solution) {
    const cell = cellsN[row * size + col];
    click(cell);
    await sleep(8);
    click(cell);
    await sleep(8);
  }
  await sleep(80);

  const savedAfterWin = window.localStorage.getItem("queens-game-state");
  console.log("localStorage cleared after completing the puzzle:", savedAfterWin === null);
  if (savedAfterWin !== null) errors.push("completing a puzzle should clear the saved game, but an entry remains");
}

// --- 18. Back button (abandoning the game on purpose) must also clear the saved entry ---
{
  // The back button lives inside GameHeader, which only exists on the
  // "playing" screen — StartScreen is a different component tree, so any
  // DOM reference to it must be re-queried after navigating, not reused.
  function getBackBtn() {
    return doc.querySelector('[aria-label="กลับไปเลือกระดับความยาก"]');
  }

  let radiosN2 = doc.querySelectorAll('[role="radio"]');
  if (radiosN2.length === 0) {
    click(getBackBtn());
    await sleep(30);
    radiosN2 = doc.querySelectorAll('[role="radio"]');
  }
  click(radiosN2[0]);
  await sleep(30);
  const startBtnN2 = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("เริ่มเกม"));
  click(startBtnN2);
  await sleep(500);

  const gridN2 = doc.querySelector('[role="grid"]');
  const cellN2 = gridN2.querySelectorAll("button")[0];
  click(cellN2); // -> X, so there's real progress to abandon
  await sleep(20);

  const hasSaveBeforeBack = window.localStorage.getItem("queens-game-state") !== null;
  click(getBackBtn()); // fresh query — this is the actual button currently in the DOM
  await sleep(30);
  const hasSaveAfterBack = window.localStorage.getItem("queens-game-state") !== null;
  console.log("save existed before back button:", hasSaveBeforeBack, "| cleared after back button:", !hasSaveAfterBack);
  if (!hasSaveBeforeBack) errors.push("expected a saved entry to exist before testing the back button");
  if (hasSaveAfterBack) errors.push("back button should clear the saved game, but an entry remains");
}

// --- 19. Corrupted/invalid localStorage data must not crash the app — it
//     should just fall back to the normal start screen. ---
{
  const dom3 = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const window3 = dom3.window;
  window3.localStorage.setItem("queens-game-state", "{ this is not valid json at all !!");
  window3.onerror = (msg) => errors.push(`[corrupted-storage] window.onerror: ${msg}`);
  window3.addEventListener("unhandledrejection", (e) => errors.push(`[corrupted-storage] unhandledrejection: ${e.reason}`));

  global.window = window3;
  global.document = window3.document;
  for (const name of Object.getOwnPropertyNames(window3)) {
    if (name in global) continue;
    try {
      global[name] = window3[name];
    } catch {
      /* ignore */
    }
  }

  let threw = false;
  try {
    await import(`${pathToFileURL(jsPath).href}?reload=${Date.now()}-corrupt`);
    await sleep(400);
  } catch (e) {
    threw = true;
    errors.push(`corrupted localStorage crashed the app: ${e.message}`);
  }

  const doc3 = window3.document;
  const radiosAfterCorrupt = doc3.querySelectorAll('[role="radio"]');
  console.log("corrupted storage: app did not throw:", !threw, "| fell back to start screen:", radiosAfterCorrupt.length === 4);
  if (!threw && radiosAfterCorrupt.length !== 4) {
    errors.push("corrupted localStorage did not gracefully fall back to the start screen");
  }
  window3.close();
  global.window = window;
  global.document = window.document;
}

// --- captured runtime/console errors ---
console.log("\n--- captured runtime/console errors ---");
if (errors.length === 0) {
  console.log("NONE ✅");
} else {
  errors.forEach((e) => console.log("❌", e));
}

process.exit(errors.length === 0 ? 0 : 1);
