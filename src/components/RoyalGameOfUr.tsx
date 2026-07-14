import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, ChevronDown, ChevronRight, ExternalLink, Github, Heart } from 'lucide-react';
import { useGameStore, useGameState, useGameActions } from '@/lib/game-store';
import { useUIStore } from '@/lib/ui-store';
import { cn, isDevelopment, getAIName } from '@/lib/utils';
import { soundEffects } from '@/lib/sound-effects';
import GameBoard from './GameBoard';
import HowToPlayPanel from './HowToPlayPanel';
import SiteBackdrop from './SiteBackdrop';
import ModeSelection from './ModeSelection';
import { getModeConfiguration } from '@/lib/game-mode';
import type { OpponentMode } from '@/lib/types';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useGameTurnScheduler } from '@/hooks/useGameTurnScheduler';

const AIDiagnosticsPanel = lazy(() => import('./AIDiagnosticsPanel'));

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
  const lastAIDiagnostics = useGameStore(state => state.lastAIDiagnostics);
  const lastAIMoveDuration = useGameStore(state => state.lastAIMoveDuration);
  const lastMoveType = useGameStore(state => state.lastMoveType);
  const lastMovePlayer = useGameStore(state => state.lastMovePlayer);

  const uiStore = useUIStore();
  const {
    reset: resetUI,
    setDiagnosticsPanelOpen,
    setHowToPlayOpen,
    setSelectedMode,
    setShowModelOverlay,
    setSoundEnabled,
  } = uiStore.actions;
  const showModelOverlay = uiStore.showModelOverlay;
  const selectedMode = uiStore.selectedMode;
  const modeConfiguration = selectedMode ? getModeConfiguration(selectedMode) : null;
  const aiSourceP1 = modeConfiguration?.player1 ?? null;
  const aiSourceP2 = modeConfiguration?.player2 ?? 'ml';
  const soundEnabled = uiStore.soundEnabled;
  const diagnosticsPanelOpen = uiStore.diagnosticsPanelOpen;
  const howToPlayOpen = uiStore.howToPlayOpen;
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandalonePWA());
  }, []);

  useGameTurnScheduler({
    gameState,
    overlayOpen: showModelOverlay,
    selectedMode,
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

  const handleReset = () => {
    reset();
    resetUI();
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

  const handleOverlaySelect = (mode: OpponentMode) => {
    setSelectedMode(mode);
    setShowModelOverlay(false);
    reset();
    reportGameStarted(mode);
    processDiceRoll();
  };

  const diagnosticsPanelOrPlaceholder = isDevelopment() ? (
    lastAIDiagnostics ? (
      <Suspense fallback={null}>
        <AIDiagnosticsPanel
          lastAIDiagnostics={lastAIDiagnostics}
          lastAIMoveDuration={lastAIMoveDuration}
          isOpen={diagnosticsPanelOpen}
          onToggle={() => setDiagnosticsPanelOpen(!diagnosticsPanelOpen)}
          gameState={gameState}
        />
      </Suspense>
    ) : (
      <div className="surface-panel rounded-lg p-3">
        <button
          type="button"
          className="w-full text-left flex justify-between items-center"
          onClick={() => setDiagnosticsPanelOpen(!diagnosticsPanelOpen)}
          aria-expanded={diagnosticsPanelOpen}
        >
          <div className="flex items-center space-x-2">
            <Bug className="w-4 h-4 text-green-400" />
            <span className="font-semibold text-sm text-white/90">AI Diagnostics</span>
            <span className="text-xs text-white/60">(Waiting for AI move)</span>
          </div>
          {diagnosticsPanelOpen ? (
            <ChevronDown className="w-5 h-5 text-white/70" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white/70" />
          )}
        </button>
        {diagnosticsPanelOpen && (
          <div className="mt-3 text-xs text-white/70">
            <p>No AI diagnostics available yet. Make a move to see AI analysis.</p>
            <p className="mt-2">
              Current AI source: {selectedMode === 'watch' ? 'N/A' : getAIName(aiSourceP2)}
            </p>
          </div>
        )}
      </div>
    )
  ) : null;

  return (
    <>
      <SiteBackdrop />
      <main className="relative z-10 min-h-screen w-full">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-8">
          <div className="flex h-10 items-center justify-end">
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
                className="hidden items-center gap-2 text-sm font-medium text-[#8e9184] transition-colors hover:text-[#eee7d8] md:inline-flex"
                title="Open the game in a compact window"
              >
                <ExternalLink className="h-4 w-4" />
                Pop out game
              </button>
            )}
          </div>

          {isDevelopment() && (
            <div className="absolute left-4 top-1/2 hidden w-80 -translate-y-1/2 xl:block">
              {diagnosticsPanelOrPlaceholder}
            </div>
          )}

          <div className="flex flex-1 flex-col py-4 sm:py-6">
            <motion.div
              className={cn('mx-auto my-auto w-full', showModelOverlay ? 'max-w-4xl' : 'max-w-md')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <header className="text-center">
                {showModelOverlay && (
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c7a65d]">
                    An ancient race game
                  </div>
                )}
                <h1
                  className={cn(
                    'display-title text-[#eee7d8]',
                    showModelOverlay ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                  )}
                  data-testid="main-title"
                >
                  Royal Game of Ur
                </h1>
                {showModelOverlay && (
                  <div
                    className="mt-3 text-sm tracking-wide text-[#8e9184]"
                    data-testid="main-subtitle"
                  >
                    Mesopotamia · Third millennium BCE
                  </div>
                )}
              </header>

              {showModelOverlay ? (
                <ModeSelection onSelect={handleOverlaySelect} onShowHowToPlay={showHowToPlay} />
              ) : (
                <div className="mt-5">
                  <GameBoard
                    gameState={gameState}
                    onPieceClick={handlePieceClick}
                    aiThinking={aiThinking}
                    onResetGame={handleReset}
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

              {isDevelopment() && (
                <div className="mt-4 xl:hidden">{diagnosticsPanelOrPlaceholder}</div>
              )}
            </motion.div>
          </div>

          <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#35382f] pt-5 text-xs text-[#8e9184] sm:flex-row">
            <span>Open source · Built for the web</span>
            <div className="flex items-center gap-5">
              <a
                href="https://github.com/tre-systems/rgou-cloudflare"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#eee7d8]"
                data-testid="github-link"
              >
                <Github className="h-3.5 w-3.5" />
                Source
              </a>
              <a
                href="https://ko-fi.com/N4N31DPNUS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#eee7d8]"
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
