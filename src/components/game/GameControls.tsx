import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, HelpCircle, RotateCcw, Dice1 } from 'lucide-react';
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
      <hr className="my-4 border-white/10" />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">{diceElement}</div>

        {isDevelopment() && (
          <div className="flex items-center space-x-2">
            <motion.button
              type="button"
              onClick={onResetGame}
              className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Reset game"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={onCreateNearWinningState}
              className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Create near-winning state"
              data-testid="create-near-winning-state"
            >
              <Dice1 className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <motion.button
            type="button"
            onClick={onShowHowToPlay}
            className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="How to Play"
            data-testid="help-button"
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onToggleSound}
            className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
            data-testid="sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </>
  );
}
