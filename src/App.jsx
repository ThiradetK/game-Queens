import { useEffect, useRef, useState } from "react";
import { GameHeader } from "./components/GameHeader.jsx";
import { StatsBar } from "./components/StatsBar.jsx";
import { GameBoard } from "./components/GameBoard.jsx";
import { GameControls } from "./components/GameControls.jsx";
import { HintBanner } from "./components/HintBanner.jsx";
import { HowToPlay } from "./components/HowToPlay.jsx";
import { CompletionModal } from "./components/CompletionModal.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { StartScreen } from "./components/StartScreen.jsx";
import { useGameStore } from "./store/gameStore.js";
import { usePuzzleGenerator } from "./hooks/usePuzzleGenerator.js";
import { playTone } from "./utils/sound.js";
import { saveGame, loadGame, clearSavedGame } from "./utils/storage.js";

export default function App() {
  const { generateForDifficulty } = usePuzzleGenerator();

  // Read any in-progress game once at mount. If one exists, skip the start
  // screen entirely and resume straight into it — this only ever holds an
  // unfinished puzzle (completing one clears its saved entry immediately).
  const [savedGame] = useState(() => loadGame());
  const [initialStoreInput] = useState(() =>
    savedGame
      ? {
          restored: true,
          puzzle: savedGame.puzzle,
          board: savedGame.board,
          difficulty: savedGame.difficulty,
          startTs: savedGame.startTs,
          hintsUsed: savedGame.hintsUsed,
        }
      : generateForDifficulty("medium")
  );

  const {
    puzzle,
    board,
    status,
    hintsUsed,
    hint,
    errorCell,
    difficulty,
    startTs,
    displayedMs,
    settings,
    toggleCell,
    resetGame,
    loadPuzzle,
    useHint,
    toggleSetting,
  } = useGameStore(initialStoreInput);

  // "menu" = difficulty must be chosen before play starts; "playing" = active game.
  const [screen, setScreen] = useState(() => (savedGame ? "playing" : "menu"));
  const [showSettings, setShowSettings] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  // Puzzle generation can take a few hundred ms on large boards — this flag
  // lets the UI paint a spinner *before* that synchronous work runs, so a
  // click never just freezes with no feedback.
  const [generating, setGenerating] = useState(false);

  // Reflect dark-mode / reduced-motion settings on <html> so the relevant
  // CSS (Tailwind's `dark:` variant, and the .motion-reduced override) applies.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.dark);
  }, [settings.dark]);

  useEffect(() => {
    document.documentElement.classList.toggle("motion-reduced", !settings.animation);
  }, [settings.animation]);

  // Persist progress on an in-progress game so a refresh (or accidentally
  // closing the tab) before finishing a puzzle can be resumed. Completed
  // games are cleared instead — there's nothing left to resume.
  useEffect(() => {
    if (screen !== "playing") return;
    if (status === "completed") {
      clearSavedGame();
      return;
    }
    saveGame({ puzzle, board, difficulty, startTs, hintsUsed });
  }, [screen, status, puzzle, board, difficulty, startTs, hintsUsed]);

  // Test-only hook, fully stripped from production builds via dead-code
  // elimination (import.meta.env.DEV is statically false when built with
  // `vite build`) — lets a dev-mode build be driven by an E2E harness
  // without shipping any puzzle-solution leak in the real bundle.
  useEffect(() => {
    if (import.meta.env.MODE !== "production" && typeof window !== "undefined" && window.__QUEENS_EXPOSE_PUZZLE__) {
      window.__QUEENS_CURRENT_PUZZLE__ = puzzle;
    }
  }, [puzzle]);

  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== "completed" && status === "completed") {
      playTone(880, 0.5, settings.sound);
    }
    prevStatus.current = status;
  }, [status, settings.sound]);

  useEffect(() => {
    if (errorCell) playTone(180, 0.18, settings.sound);
  }, [errorCell, settings.sound]);

  useEffect(() => {
    if (hint?.kind === "correct") playTone(660, 0.16, settings.sound);
    else if (hint?.kind === "wrong") playTone(220, 0.22, settings.sound);
  }, [hint, settings.sound]);

  function handleStart(chosenDifficulty) {
    setGenerating(true);
    // Deferred so React can paint the spinner before the (possibly ~½s on
    // a 9×9 board) synchronous puzzle generation runs.
    setTimeout(() => {
      loadPuzzle(generateForDifficulty(chosenDifficulty));
      setScreen("playing");
      setGenerating(false);
    }, 30);
  }

  function handleNewPuzzle() {
    setGenerating(true);
    setTimeout(() => {
      loadPuzzle(generateForDifficulty(difficulty));
      setGenerating(false);
    }, 30);
  }

  function handleBackToMenu() {
    clearSavedGame();
    setScreen("menu");
  }

  if (screen === "menu") {
    return <StartScreen onStart={handleStart} loading={generating} />;
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-10 text-ink-900 transition-colors dark:bg-ink-900 dark:text-white">
      <GameHeader
        onBack={handleBackToMenu}
        onHelp={() => setShowHowTo((v) => !v)}
        onSettings={() => setShowSettings(true)}
      />

      <main className="mx-auto max-w-xl px-4">
        <StatsBar ms={displayedMs} difficulty={difficulty} />

        <GameBoard
          puzzle={puzzle}
          board={board}
          errorCell={errorCell}
          hint={hint}
          status={status}
          onActivate={toggleCell}
        />

        <GameControls
          hintsUsed={hintsUsed}
          gameCompleted={status === "completed"}
          generating={generating}
          onReset={resetGame}
          onHint={useHint}
          onNewPuzzle={handleNewPuzzle}
        />

        <HintBanner hint={hint} />

        <HowToPlay open={showHowTo} onToggle={() => setShowHowTo((v) => !v)} />
      </main>

      {status === "completed" && (
        <CompletionModal
          elapsedMs={displayedMs}
          generating={generating}
          onPlayAgain={resetGame}
          onNextPuzzle={handleNewPuzzle}
        />
      )}

      {showSettings && (
        <SettingsModal settings={settings} onToggle={toggleSetting} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
