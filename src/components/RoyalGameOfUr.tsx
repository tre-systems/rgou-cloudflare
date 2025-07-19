'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Brain, Cpu, Eye } from 'lucide-react';
import Image from 'next/image';
import { useGameStore, useGameState, useGameActions } from '@/lib/game-store';
import { useUIStore } from '@/lib/ui-store';
import { isDevelopment, getAIName } from '@/lib/utils';
import { soundEffects } from '@/lib/sound-effects';
import GameBoard from './GameBoard';
import AIDiagnosticsPanel from './AIDiagnosticsPanel';
import HowToPlayPanel from './HowToPlayPanel';
import AnimatedBackground from './AnimatedBackground';
import { Bug, ChevronDown, ChevronRight } from 'lucide-react';
import ModeSelectionCard from './ModeSelectionCard';

const MODE_OPTIONS = [
  {
    key: 'heuristic',
    label: 'Heuristic AI',
    description: 'A fast and competitive AI using immediate position evaluation.',
    subtitle: 'Best performing AI (53.6% win rate)',
    icon: Cpu,
    colorClass: 'text-green-400',
    borderColorClass: 'border-green-400/30 hover:border-green-400/60',
  },
  {
    key: 'classic',
    label: 'Classic AI',
    description: 'A strategic opponent using a classic game AI algorithm.',
    subtitle: 'Expectiminimax algorithm',
    icon: Cpu,
    colorClass: 'text-blue-400',
    borderColorClass: 'border-blue-400/30 hover:border-blue-400/60',
  },
  {
    key: 'ml',
    label: 'Machine Learning AI',
    description: 'A modern opponent that learned by observing thousands of games.',
    subtitle: 'Neural network model',
    icon: Brain,
    colorClass: 'text-purple-400',
    borderColorClass: 'border-purple-400/30 hover:border-purple-400/60',
  },
  {
    key: 'watch',
    label: 'Watch a Match',
    description: 'Sit back and watch the Heuristic AI challenge the ML AI.',
    subtitle: '',
    icon: Eye,
    colorClass: 'text-orange-400',
    borderColorClass: 'border-orange-400/30 hover:border-orange-400/60',
  },
];

function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export default function RoyalGameOfUr() {
  const gameState = useGameState();
  const { processDiceRoll, endTurn, makeMove, makeAIMove, reset } = useGameActions();
  const aiThinking = useGameStore(state => state.aiThinking);
  const lastAIDiagnostics = useGameStore(state => state.lastAIDiagnostics);
  const lastAIMoveDuration = useGameStore(state => state.lastAIMoveDuration);
  const lastMoveType = useGameStore(state => state.lastMoveType);
  const lastMovePlayer = useGameStore(state => state.lastMovePlayer);

  const uiStore = useUIStore();
  const { setSelectedMode, setAiSourceP1, setAiSourceP2 } = uiStore.actions;
  const selectedMode = uiStore.selectedMode;
  const aiSourceP1 = uiStore.aiSourceP1;
  const aiSourceP2 = uiStore.aiSourceP2;
  const [showModelOverlay, setShowModelOverlay] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [diagnosticsPanelOpen, setDiagnosticsPanelOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandalonePWA());
  }, []);

  useEffect(() => {
    if (showModelOverlay || gameState.gameStatus !== 'playing') {
      return;
    }

    const isWatchMode = selectedMode === 'watch';
    const isAIsTurn =
      isWatchMode ||
      (gameState.currentPlayer === 'player2' &&
        (selectedMode === 'classic' || selectedMode === 'ml' || selectedMode === 'heuristic'));

    if (!isAIsTurn && gameState.canMove) {
      return;
    }

    if (gameState.diceRoll === null) {
      const timer = setTimeout(() => processDiceRoll(), 500);
      return () => clearTimeout(timer);
    }

    if (isAIsTurn && gameState.canMove) {
      const moveDelay = selectedMode === 'watch' ? 750 : 250;
      const timer = setTimeout(() => {
        const aiSource = gameState.currentPlayer === 'player1' ? aiSourceP1 : aiSourceP2;
        if (aiSource) {
          if (!isWatchMode) soundEffects.aiThinking();
          makeAIMove(aiSource as 'heuristic' | 'client' | 'ml', isWatchMode);
        }
      }, moveDelay);
      return () => clearTimeout(timer);
    }

    if (gameState.diceRoll !== null && !gameState.canMove) {
      const timer = setTimeout(() => endTurn(), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    gameState,
    showModelOverlay,
    selectedMode,
    aiSourceP1,
    aiSourceP2,
    processDiceRoll,
    endTurn,
    makeAIMove,
  ]);

  useEffect(() => {
    if (gameState.gameStatus === 'finished') {
      setTimeout(() => {
        if (gameState.winner === 'player1') {
          soundEffects.gameWin();
        } else {
          soundEffects.gameLoss();
        }
      }, 500);
    }
  }, [gameState.gameStatus, gameState.winner]);

  useEffect(() => {
    if (lastMoveType && lastMovePlayer) {
      switch (lastMoveType) {
        case 'capture':
          soundEffects.pieceCapture();
          break;
        case 'rosette':
          soundEffects.rosetteLanding();
          break;
        case 'finish':
          soundEffects.pieceFinish();
          break;
        case 'move':
          soundEffects.pieceMove();
          break;
      }
    }
  }, [lastMoveType, lastMovePlayer]);

  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

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
    setShowModelOverlay(true);
    setSelectedMode(null);
    setAiSourceP1(null);
    setAiSourceP2('ml');
  };

  const toggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);
  };

  const showHowToPlay = () => {
    setHowToPlayOpen(true);
  };

  const createNearWinningState = () => {
    const { actions } = useGameStore.getState();
    actions.createNearWinningState();
  };

  const handleOverlaySelect = (mode: 'heuristic' | 'classic' | 'ml' | 'watch') => {
    setSelectedMode(mode);
    if (mode === 'heuristic') {
      setAiSourceP1(null);
      setAiSourceP2('heuristic');
    } else if (mode === 'classic') {
      setAiSourceP1(null);
      setAiSourceP2('client');
    } else if (mode === 'ml') {
      setAiSourceP1(null);
      setAiSourceP2('ml');
    } else if (mode === 'watch') {
      setAiSourceP1('client');
      setAiSourceP2('ml');
    }

    setShowModelOverlay(false);
    reset();

    setTimeout(() => {
      processDiceRoll();
    }, 0);
  };

  const diagnosticsPanelOrPlaceholder = isDevelopment() ? (
    lastAIDiagnostics ? (
      <AIDiagnosticsPanel
        lastAIDiagnostics={lastAIDiagnostics}
        lastAIMoveDuration={lastAIMoveDuration}
        isOpen={diagnosticsPanelOpen}
        onToggle={() => setDiagnosticsPanelOpen(!diagnosticsPanelOpen)}
        gameState={gameState}
      />
    ) : (
      <div className="glass-dark rounded-lg p-3">
        <button
          className="w-full text-left flex justify-between items-center"
          onClick={() => setDiagnosticsPanelOpen(!diagnosticsPanelOpen)}
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
              Current AI source: {selectedMode === 'watch' ? 'N/A' : getAIName('ml')}
            </p>
          </div>
        )}
      </div>
    )
  ) : null;

  return (
    <>
      <AnimatedBackground />
      <div className="relative min-h-screen w-full flex items-center justify-center p-4">
        {/* Only show Pop Out Game button if not in standalone PWA mode */}
        {!isStandalone && (
          <div className="hidden md:block absolute top-4 right-4 z-50">
            <button
              onClick={() => {
                window.open(
                  '/',
                  'GamePopout',
                  'width=420,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
                );
              }}
              className="glass-dark rounded-lg px-4 py-2 flex items-center space-x-2 text-white/80 hover:text-white font-semibold shadow-lg backdrop-blur-md border border-white/10 transition-colors"
              title="Pop Out Game"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              <span>Pop Out Game</span>
            </button>
          </div>
        )}
        {isDevelopment() && (
          <div className="hidden xl:block absolute left-4 top-1/2 -translate-y-1/2 w-80">
            {diagnosticsPanelOrPlaceholder}
          </div>
        )}
        <motion.div
          className="w-full max-w-sm mx-auto space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center space-y-1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 neon-text"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
              data-testid="main-title"
            >
              Royal Game of Ur
            </motion.h1>

            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <svg
                className="w-3 h-3 text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636"
                />
              </svg>
              <span className="text-white/80 font-medium text-sm" data-testid="main-subtitle">
                Ancient Mesopotamian Board Game
              </span>
              <svg
                className="w-3 h-3 text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636"
                />
              </svg>
            </motion.div>
            <div className="h-4"></div>
          </motion.div>

          {showModelOverlay ? (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div
                className="glass-dark rounded-2xl p-6 md:p-8 w-full text-center space-y-4"
                data-testid="ai-model-selection"
              >
                <h2 className="text-xl font-bold text-white">Select Your Opponent</h2>
                <p className="text-gray-300 text-sm">
                  Choose an AI to challenge, or watch them battle.
                </p>
                <div className="space-y-3 pt-2">
                  {MODE_OPTIONS.map(mode => (
                    <ModeSelectionCard
                      key={mode.key}
                      icon={mode.icon}
                      title={mode.label}
                      description={mode.description}
                      subtitle={mode.subtitle}
                      onClick={() => handleOverlaySelect(mode.key as 'classic' | 'ml' | 'watch')}
                      colorClass={mode.colorClass}
                      borderColorClass={mode.borderColorClass}
                      data-testid={`mode-select-${mode.key}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
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
              data-testid="game-board-component"
            />
          )}

          {isDevelopment() && <div className="xl:hidden">{diagnosticsPanelOrPlaceholder}</div>}

          <HowToPlayPanel isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />

          <div className="h-4"></div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <p className="text-center">
              <a href="https://ko-fi.com/N4N31DPNUS" target="_blank" rel="noopener noreferrer">
                <Image
                  width={145}
                  height={36}
                  className="block mx-auto"
                  src="https://storage.ko-fi.com/cdn/kofi2.png?v=6"
                  alt="Buy Me a Coffee at ko-fi.com"
                />
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
