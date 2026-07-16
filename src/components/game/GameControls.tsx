import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, HelpCircle, LogOut, Dice1 } from 'lucide-react';
import { isDevelopment } from '@/lib/utils';

interface GameControlsProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onQuitGame: () => void;
  onCreateNearWinningState: () => void;
  diceElement: ReactNode;
}

export default function GameControls({
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  onQuitGame,
  onCreateNearWinningState,
  diceElement,
}: GameControlsProps) {
  return (
    <>
      <hr className="my-4 border-line" />
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center">{diceElement}</div>

        {isDevelopment() && (
          <div className="flex items-center space-x-2">
            <motion.button
              type="button"
              onClick={onCreateNearWinningState}
              className="icon-button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Create near-winning state"
              data-testid="create-near-winning-state"
            >
              <Dice1 className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={onQuitGame}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-bone-muted transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-bone"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Quit game and choose another opponent"
            title="Quit game and choose another opponent"
            data-testid="quit-game"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="min-[380px]:hidden">Quit</span>
            <span className="hidden min-[380px]:inline">Quit game</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={onShowHowToPlay}
            className="icon-button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="How to Play"
            title="How to play"
            data-testid="help-button"
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onToggleSound}
            className="icon-button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
            title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            data-testid="sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </>
  );
}
