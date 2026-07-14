import { useEffect } from 'react';
import { soundEffects } from '@/lib/sound-effects';
import type { GameStatus, MoveType, Player } from '@/lib/types';

interface GameAudioOptions {
  soundEnabled: boolean;
  gameStatus: GameStatus;
  winner: Player | null;
  lastMoveType: MoveType | null;
  lastMovePlayer: Player | null;
  reportGameCompleted: () => void;
}

export function useGameAudio({
  soundEnabled,
  gameStatus,
  winner,
  lastMoveType,
  lastMovePlayer,
  reportGameCompleted,
}: GameAudioOptions) {
  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (!lastMoveType || !lastMovePlayer) return;

    const sounds: Record<MoveType, () => Promise<void>> = {
      capture: () => soundEffects.pieceCapture(),
      finish: () => soundEffects.pieceFinish(),
      move: () => soundEffects.pieceMove(),
      rosette: () => soundEffects.rosetteLanding(),
    };

    void sounds[lastMoveType]();
  }, [lastMovePlayer, lastMoveType]);

  useEffect(() => {
    if (gameStatus !== 'finished') return;

    reportGameCompleted();
    const timer = window.setTimeout(() => {
      if (winner === 'player1') {
        void soundEffects.gameWin();
      } else {
        void soundEffects.gameLoss();
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [gameStatus, reportGameCompleted, winner]);
}
