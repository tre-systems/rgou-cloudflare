'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Brain, Volume2, VolumeX, HelpCircle, RotateCcw, Dice1 } from 'lucide-react';
import { isDevelopment } from '@/lib/utils';

interface GameControlsProps {
  aiSource: 'client' | 'ml';
  onAiSourceChange: (aiSource: 'client' | 'ml') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onResetGame: () => void;
  onCreateNearWinningState: () => void;
  diceElement: React.ReactNode;
}

export default function GameControls({
  aiSource,
  onAiSourceChange,
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  onResetGame,
  onCreateNearWinningState,
  diceElement,
}: GameControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 glass-dark rounded-lg">
      <div className="flex items-center space-x-2">
        {diceElement}

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

        {isDevelopment() && (
          <div className="flex items-center space-x-1">
            <motion.button
              onClick={() => onAiSourceChange('client')}
              className={`p-1.5 glass-dark rounded-lg transition-colors ${
                aiSource === 'client'
                  ? 'text-blue-400 bg-blue-400/20 border-2 border-blue-400/40'
                  : 'text-white/70 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Classic AI (Expectiminimax)"
            >
              <Cloud className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              onClick={() => onAiSourceChange('ml')}
              className={`p-1.5 glass-dark rounded-lg transition-colors ${
                aiSource === 'ml'
                  ? 'text-purple-400 bg-purple-400/20 border-2 border-purple-400/40'
                  : 'text-white/70 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="ML AI (Neural Network)"
            >
              <Brain className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {isDevelopment() && (
          <motion.button
            onClick={onCreateNearWinningState}
            className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Create Near-Winning State (Dev)"
          >
            <Dice1 className="w-4 h-4" />
          </motion.button>
        )}

        <motion.button
          onClick={onResetGame}
          className="p-2 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset Game"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
