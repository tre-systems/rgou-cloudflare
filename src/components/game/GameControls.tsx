'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Cloud, Server, Trophy, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { isLocalDevelopment, isProduction } from '@/lib/utils';

interface GameControlsProps {
  aiSource: 'server' | 'client';
  onAiSourceChange: (source: 'server' | 'client') => void;
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
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center h-8">
          <div className="min-w-[70px] h-8 flex items-center">{diceElement}</div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={onShowHowToPlay}
            className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="How to Play"
            data-testid="help-button"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </motion.button>

          {isLocalDevelopment() && (
            <motion.button
              onClick={() => onAiSourceChange(aiSource === 'server' ? 'client' : 'server')}
              className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${aiSource === 'server' ? 'Client' : 'Server'} AI`}
            >
              {aiSource === 'server' ? (
                <Cloud className="w-3.5 h-3.5" />
              ) : (
                <Server className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}

          {isLocalDevelopment() && (
            <motion.button
              onClick={onCreateNearWinningState}
              className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Test Database: Create near-winning state to test game saving"
              data-testid="create-near-winning-state"
            >
              <Trophy className="w-3.5 h-3.5" />
            </motion.button>
          )}

          <motion.button
            onClick={onToggleSound}
            className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="sound-toggle"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </motion.button>

          {!isProduction() && (
            <motion.button
              onClick={onResetGame}
              className="p-1.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 10px rgba(107, 114, 128, 0.3)',
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <RotateCcw className="w-3.5 h-3.5" />
              </motion.div>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
