import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Heart, Scale } from 'lucide-react';
import { useGameStore, useGameState, useGameActions } from '@/lib/game-store';
import { useUIStore } from '@/lib/ui-store';
import { cn } from '@/lib/utils';
import { soundEffects } from '@/lib/sound-effects';
import GameBoard from './GameBoard';
import HowToPlayPanel from './HowToPlayPanel';
import SiteBackdrop from './SiteBackdrop';
import ModeSelection from './ModeSelection';
import { getModeConfiguration } from '@/lib/game-mode';
import type { OpponentMode, WatchMatchup } from '@/lib/types';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useGameTurnScheduler } from '@/hooks/useGameTurnScheduler';

function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export default function RoyalGameOfUr() {
  const gameState = useGameState();
  const {
    processDiceRoll,
    endTurn,
    makeMove,
    makeAIMove,
    reset,
    reportGameStarted,
    reportGameCompleted,
    createNearWinningState: createNearWinningStateAction,
  } = useGameActions();
  const aiThinking = useGameStore(state => state.aiThinking);
  const lastMoveType = useGameStore(state => state.lastMoveType);
  const lastMovePlayer = useGameStore(state => state.lastMovePlayer);

  const uiStore = useUIStore();
  const {
    setHowToPlayOpen,
    setSelectedMode,
    setShowModelOverlay,
    setSoundEnabled,
    setWatchMatchup,
  } = uiStore.actions;
  const showModelOverlay = uiStore.showModelOverlay;
  const selectedMode = uiStore.selectedMode;
  const watchMatchup = uiStore.watchMatchup;
  const modeConfiguration = selectedMode ? getModeConfiguration(selectedMode, watchMatchup) : null;
  const aiSourceP1 = modeConfiguration?.player1 ?? null;
  const aiSourceP2 = modeConfiguration?.player2 ?? 'ml';
  const soundEnabled = uiStore.soundEnabled;
  const howToPlayOpen = uiStore.howToPlayOpen;
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandalonePWA());
  }, []);

  useGameTurnScheduler({
    gameState,
    overlayOpen: showModelOverlay,
    selectedMode,
    watchMatchup,
    processDiceRoll,
    endTurn,
    makeAIMove,
  });

  useGameAudio({
    soundEnabled,
    gameStatus: gameState.gameStatus,
    winner: gameState.winner,
    lastMoveType,
    lastMovePlayer,
    reportGameCompleted,
  });

  const handlePieceClick = useCallback(
    (pieceIndex: number) => {
      if (
        gameState.canMove &&
        gameState.validMoves.includes(pieceIndex) &&
        gameState.currentPlayer === 'player1' &&
        selectedMode !== 'watch'
      ) {
        makeMove(pieceIndex);
      }
    },
    [gameState.canMove, gameState.validMoves, gameState.currentPlayer, makeMove, selectedMode]
  );

  const handleQuitGame = () => {
    reset();
    setHowToPlayOpen(false);
    setSelectedMode(null);
    setShowModelOverlay(true);
  };

  const toggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);
  };

  const showHowToPlay = () => {
    setHowToPlayOpen(true);
  };

  const createNearWinningState = () => {
    createNearWinningStateAction();
  };

  const handleOverlaySelect = (mode: OpponentMode, matchup?: WatchMatchup) => {
    const selectedWatchMatchup = matchup ?? watchMatchup;
    if (mode === 'watch') setWatchMatchup(selectedWatchMatchup);
    setSelectedMode(mode);
    setShowModelOverlay(false);
    reset();
    reportGameStarted(mode, selectedWatchMatchup);
    processDiceRoll();
  };

  return (
    <>
      <SiteBackdrop />
      <main className="relative z-10 min-h-dvh w-full">
        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-3 sm:px-6 sm:py-8">
          <div className="hidden h-10 items-center justify-end md:flex">
            {!isStandalone && (
              <button
                type="button"
                onClick={() => {
                  window.open(
                    '/',
                    'GamePopout',
                    'width=440,height=820,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no,noopener,noreferrer'
                  );
                }}
                className="hidden items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-bone md:inline-flex"
                title="Open the game in a compact window"
              >
                <ExternalLink className="h-4 w-4" />
                Pop out game
              </button>
            )}
          </div>

          <div className="flex flex-1 flex-col pb-4 md:py-6">
            <motion.div
              className={cn(
                'mx-auto w-full md:my-auto',
                showModelOverlay ? 'max-w-4xl' : 'max-w-md'
              )}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <header className="text-center">
                {showModelOverlay && (
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-brass">
                    An ancient race game
                  </div>
                )}
                <h1
                  className={cn(
                    'display-title text-bone',
                    showModelOverlay ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                  )}
                  data-testid="main-title"
                >
                  Royal Game of Ur
                </h1>
                {showModelOverlay && (
                  <div
                    className="mt-3 text-sm tracking-wide text-muted"
                    data-testid="main-subtitle"
                  >
                    Mesopotamia · Third millennium BCE
                  </div>
                )}
              </header>

              {showModelOverlay ? (
                <ModeSelection
                  watchMatchup={watchMatchup}
                  onSelect={handleOverlaySelect}
                  onShowHowToPlay={showHowToPlay}
                />
              ) : (
                <div className="mt-5">
                  <GameBoard
                    gameState={gameState}
                    onPieceClick={handlePieceClick}
                    aiThinking={aiThinking}
                    onQuitGame={handleQuitGame}
                    soundEnabled={soundEnabled}
                    onToggleSound={toggleSound}
                    onShowHowToPlay={showHowToPlay}
                    onCreateNearWinningState={createNearWinningState}
                    watchMode={selectedMode === 'watch'}
                    aiSourceP1={aiSourceP1}
                    aiSourceP2={aiSourceP2}
                    lastMoveType={lastMoveType}
                    lastMovePlayer={lastMovePlayer}
                  />
                </div>
              )}
            </motion.div>
          </div>

          <footer className="flex items-center justify-center border-t border-line-soft pt-3 text-xs text-muted sm:justify-between sm:pt-5">
            <span className="hidden sm:inline">Open source · Built for the web</span>
            <div className="flex items-center gap-5">
              <a
                href="/ai"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-bone"
                data-testid="ai-guide-link"
              >
                <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                About the AIs
              </a>
              <a
                href="https://github.com/tre-systems/rgou-cloudflare"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-bone"
                data-testid="github-link"
              >
                <Github className="h-3.5 w-3.5" />
                Source
              </a>
              <a
                href="https://ko-fi.com/N4N31DPNUS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-bone"
              >
                <Heart className="h-3.5 w-3.5" />
                Support the project
              </a>
            </div>
          </footer>
        </div>

        <HowToPlayPanel isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
      </main>
    </>
  );
}
