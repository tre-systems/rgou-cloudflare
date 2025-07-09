'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { GameState } from '@/lib/types';
import { cn } from '@/lib/utils';

export type AISource = 'server' | 'client';

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  aiThinking?: boolean;
  aiSource: AISource;
  onAiSourceChange: (source: AISource) => void;
}

export default function GameControls({ gameState }: GameControlsProps) {
  return (
    <AnimatePresence>
      {gameState.gameStatus === 'finished' && (
        <motion.div
          className="glass rounded-lg p-6 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut',
              }}
            >
              {gameState.winner === 'player1' ? (
                <Trophy className="w-16 h-16 text-green-400 mx-auto mb-2" />
              ) : (
                <Zap className="w-16 h-16 text-pink-400 mx-auto mb-2" />
              )}
            </motion.div>
            <h2
              className={cn(
                'text-2xl font-bold neon-text',
                gameState.winner === 'player1' ? 'text-green-400' : 'text-pink-400'
              )}
            >
              {gameState.winner === 'player1' ? 'Victory!' : 'AI Wins!'}
            </h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
