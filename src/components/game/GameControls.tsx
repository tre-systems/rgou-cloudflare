import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, HelpCircle, RefreshCcw, Dice1 } from 'lucide-react';
import { isDevelopment } from '@/lib/utils';

interface GameControlsProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onResetGame: () => void;
  onCreateNearWinningState: () => void;
  diceElement: ReactNode;
}

export default function GameControls({
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  onResetGame,
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
            onClick={onResetGame}
            className="icon-button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Choose another opponent"
            title="Choose another opponent"
            data-testid="change-opponent"
          >
            <RefreshCcw className="h-4 w-4" />
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
