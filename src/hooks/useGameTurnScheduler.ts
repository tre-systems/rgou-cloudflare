import { useEffect } from 'react';
import { getAISource, getModeConfiguration, isAITurn } from '@/lib/game-mode';
import { soundEffects } from '@/lib/sound-effects';
import type { AISource, GameState, OpponentMode, WatchMatchup } from '@/lib/types';

interface GameTurnSchedulerOptions {
  gameState: GameState;
  overlayOpen: boolean;
  selectedMode: OpponentMode | null;
  watchMatchup: WatchMatchup;
  processDiceRoll: () => void;
  endTurn: () => void;
  makeAIMove: (source: AISource, watchMode: boolean) => Promise<void>;
}

export function useGameTurnScheduler({
  gameState,
  overlayOpen,
  selectedMode,
  watchMatchup,
  processDiceRoll,
  endTurn,
  makeAIMove,
}: GameTurnSchedulerOptions) {
  const { canMove, currentPlayer, diceRoll, gameStatus } = gameState;

  useEffect(() => {
    if (overlayOpen || gameStatus !== 'playing' || !selectedMode) return;

    const mode = getModeConfiguration(selectedMode, watchMatchup);
    const currentTurnIsAI = isAITurn(selectedMode, currentPlayer, watchMatchup);

    if (!currentTurnIsAI && canMove) return;

    if (diceRoll === null) {
      const timer = window.setTimeout(processDiceRoll, 500);
      return () => window.clearTimeout(timer);
    }

    if (currentTurnIsAI && canMove) {
      const timer = window.setTimeout(
        () => {
          const aiSource = getAISource(selectedMode, currentPlayer, watchMatchup);
          if (!aiSource) return;

          if (!mode.watch) void soundEffects.aiThinking();
          void makeAIMove(aiSource, mode.watch);
        },
        mode.watch ? 750 : 250
      );
      return () => window.clearTimeout(timer);
    }

    if (!canMove) {
      const timer = window.setTimeout(endTurn, 1500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [
    canMove,
    currentPlayer,
    diceRoll,
    endTurn,
    gameStatus,
    makeAIMove,
    overlayOpen,
    processDiceRoll,
    selectedMode,
    watchMatchup,
  ]);
}
