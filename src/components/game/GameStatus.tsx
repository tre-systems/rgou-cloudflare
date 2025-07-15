'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getAIName } from '@/lib/utils';
import { GameState } from '@/lib/types';
import { Dice6, Crown, Zap, Trophy, XCircle, Brain, Cpu } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  aiThinking: boolean;
  watchMode?: boolean;
  aiSourceP1?: 'client' | 'ml' | null;
  aiSourceP2?: 'client' | 'ml';
}

export default function GameStatus({
  gameState,
  aiThinking,
  watchMode = false,
  aiSourceP1 = null,
  aiSourceP2 = 'ml',
}: GameStatusProps) {
  const getStatusMessage = () => {
    if (gameState.gameStatus === 'finished') {
      return {
        text: gameState.winner === 'player1' ? 'Victory!' : 'AI Wins!',
        icon: gameState.winner === 'player1' ? Trophy : Zap,
        color: gameState.winner === 'player1' ? 'text-green-400' : 'text-pink-400',
      };
    }

    if (watchMode) {
      const currentAISource = gameState.currentPlayer === 'player1' ? aiSourceP1 : aiSourceP2;
      return {
        text: `${getAIName(currentAISource)}'s turn`,
        icon: currentAISource === 'ml' ? Brain : Cpu,
        color: currentAISource === 'ml' ? 'text-purple-400' : 'text-blue-400',
      };
    }

    if (gameState.currentPlayer === 'player1') {
      if (gameState.diceRoll === null) {
        return {
          text: 'Roll the dice!',
          icon: Dice6,
          color: 'text-blue-400',
        };
      }
      if (!gameState.canMove) {
        return {
          text: 'No valid moves',
          icon: XCircle,
          color: 'text-red-400',
        };
      }
      return {
        text: 'Your turn',
        icon: Crown,
        color: 'text-blue-400',
      };
    } else {
      if (aiThinking) {
        return {
          text: 'AI thinking...',
          icon: Zap,
          color: 'text-pink-400',
        };
      }
      return {
        text: 'AI turn',
        icon: Zap,
        color: 'text-pink-400',
      };
    }
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;
  const isValidIcon =
    typeof StatusIcon === 'function' || (typeof StatusIcon === 'object' && StatusIcon !== null);

  return (
    <div className="text-center mb-3">
      <div className="mt-2 h-10 flex flex-col justify-start relative pt-1">
        <motion.div
          className="flex items-center justify-center space-x-2 h-6"
          animate={{ scale: aiThinking ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: aiThinking ? Infinity : 0, duration: 1 }}
        >
          {isValidIcon ? (
            <StatusIcon className={cn('w-4 h-4', status.color)} data-testid="game-status-icon" />
          ) : null}
          <span
            className={cn('font-bold text-lg', status.color, 'neon-text')}
            data-testid="game-status-text"
          >
            {status.text}
          </span>
        </motion.div>

        <AnimatePresence>
          {aiThinking && (
            <motion.div
              className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-pink-400 rounded-full"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
