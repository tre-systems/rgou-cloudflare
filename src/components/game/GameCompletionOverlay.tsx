'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameState, GameMode } from '@/lib/types';
import { useGameStats } from '@/lib/stats-store';

interface GameCompletionOverlayProps {
  gameState: GameState;
  onResetGame: () => void;
  gameMode: GameMode;
}

export default function GameCompletionOverlay({
  gameState,
  onResetGame,
  gameMode,
}: GameCompletionOverlayProps) {
  const gameStats = useGameStats();
  const isPlayer1Winner = gameState.winner === 'player1';
  const isWatchMode = gameMode === 'watch';

  const title = isWatchMode
    ? isPlayer1Winner
      ? 'Expectiminimax Wins!'
      : 'ML AI Wins!'
    : isPlayer1Winner
      ? 'Victory!'
      : 'AI Wins!';

  const message = isWatchMode
    ? isPlayer1Winner
      ? 'The classic AI proved its strength!'
      : 'The ML AI has triumphed!'
    : isPlayer1Winner
      ? '🎉 Victory is yours! 🎉'
      : '💫 The AI mastered the game! 💫';

  return (
    <motion.div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="game-completion-overlay"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              backgroundColor: [
                '#ff6b6b',
                '#4ecdc4',
                '#45b7d1',
                '#96ceb4',
                '#feca57',
                '#ff9ff3',
                '#54a0ff',
              ][Math.floor(Math.random() * 7)],
            }}
            initial={{ y: -10, x: 0, rotate: 0, scale: 0 }}
            animate={{
              y: ['100vh', '100vh'],
              x: [0, Math.random() * 200 - 100],
              rotate: [0, 360],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {isPlayer1Winner && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-32 bg-gradient-to-b from-yellow-400 to-transparent opacity-60"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: 'center',
                transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 0.6, 0] }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {!isPlayer1Winner && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-transparent opacity-80"
              style={{
                left: `${20 + i * 10}%`,
                top: '0',
                height: '100%',
                transform: `skewX(${Math.random() * 20 - 10}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 0.8, 0] }}
              transition={{
                duration: 0.3,
                delay: i * 0.2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="glass rounded-lg p-8 text-center shadow-2xl max-w-sm mx-4 relative overflow-hidden"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: isPlayer1Winner
              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="text-center relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: isPlayer1Winner ? '#22c55e' : '#ec4899',
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

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
            {isPlayer1Winner ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.5,
                }}
              >
                <Trophy className="w-20 h-20 text-green-400 mx-auto mb-4 drop-shadow-lg" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.5,
                }}
              >
                <Zap className="w-20 h-20 text-pink-400 mx-auto mb-4 drop-shadow-lg" />
              </motion.div>
            )}
          </motion.div>

          <motion.h2
            className={cn(
              'text-4xl font-bold neon-text mb-6',
              isPlayer1Winner ? 'text-green-400' : 'text-pink-400'
            )}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.8,
            }}
            data-testid="game-completion-title"
          >
            {title}
          </motion.h2>

          <motion.div
            className="text-white/80 mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 1.0,
            }}
          >
            <p className="text-lg mb-3" data-testid="game-completion-message">
              {message}
            </p>

            {!isWatchMode && (
              <motion.div
                className="bg-white/10 rounded-lg p-4 backdrop-blur-sm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 1.3,
                }}
                data-testid="stats-panel"
              >
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Your Record</h3>
                  <div className="flex justify-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400" data-testid="wins-count">
                        {gameStats.wins}
                      </div>
                      <div className="text-xs text-white/70">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400" data-testid="losses-count">
                        {gameStats.losses}
                      </div>
                      <div className="text-xs text-white/70">Losses</div>
                    </div>
                  </div>
                  {gameStats.gamesPlayed > 0 && (
                    <div className="mt-2 text-xs text-white/60" data-testid="games-played">
                      Win Rate: {Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)}%
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.button
            onClick={onResetGame}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg relative overflow-hidden group"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            data-testid="reset-game-button"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 1.5,
              }}
            />
            <span className="relative z-10">Play Again</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
