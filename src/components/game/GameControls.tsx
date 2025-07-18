'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, HelpCircle, RotateCcw, Dice1 } from 'lucide-react';
import { isDevelopment } from '@/lib/utils';

interface GameControlsProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onResetGame: () => void;
  onCreateNearWinningState: () => void;
  diceElement: React.ReactNode;
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
        {/* Dice on the far left */}
        <div className="flex items-center">{diceElement}</div>

        {/* Dev-only controls in the middle */}
        {isDevelopment() && (
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={onResetGame}
              className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Reset Game"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={onCreateNearWinningState}
              className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Create Near-Winning State (Dev)"
              data-testid="create-near-winning-state"
            >
              <Dice1 className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Main controls on the far right */}
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={onShowHowToPlay}
            className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="How to Play"
            data-testid="help-button"
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onToggleSound}
            className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
            data-testid="sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </>
  );
}
