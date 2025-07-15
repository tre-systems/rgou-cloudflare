'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/lib/types';

interface GamePieceProps {
  player: Player;
  isClickable: boolean;
  isBeingCaptured?: boolean;
  isFinishing?: boolean;
}

const GamePiece = React.memo(function GamePiece({
  player,
  isClickable,
  isBeingCaptured = false,
  isFinishing = false,
}: GamePieceProps) {
  const isPlayer1 = player === 'player1';
  const colors = isPlayer1
    ? {
        bg: 'bg-blue-500',
        border: 'border-blue-400',
        shadow: 'shadow-blue-500/50',
        glow: 'shadow-blue-400',
      }
    : {
        bg: 'bg-pink-500',
        border: 'border-pink-400',
        shadow: 'shadow-pink-500/50',
        glow: 'shadow-pink-400',
      };

  return (
    <motion.div
      className={`w-full h-full rounded-full border-2 relative overflow-hidden ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } ${colors.bg} ${colors.border} ${colors.shadow}`}
      whileHover={isClickable ? { scale: 1.1, boxShadow: `0 0 20px ${colors.glow}` } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      animate={
        isBeingCaptured
          ? {
              scale: [1, 1.2, 0],
              rotate: [0, 180, 360],
              opacity: [1, 0.8, 0],
            }
          : isFinishing
            ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  `0 0 10px ${colors.glow}`,
                  `0 0 20px ${colors.glow}`,
                  `0 0 10px ${colors.glow}`,
                ],
              }
            : {}
      }
      transition={
        isBeingCaptured
          ? { duration: 0.8, ease: 'easeInOut' }
          : isFinishing
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 400, damping: 25 }
      }
      data-testid={`game-piece-${player}-${isClickable ? 'clickable' : 'static'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tl from-black/20 to-transparent" />

      {isClickable && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/50 pointer-events-none"
          animate={{
            boxShadow: [`0 0 0 0 rgba(255, 255, 255, 0.7)`, `0 0 0 8px rgba(255, 255, 255, 0)`],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {isFinishing && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/50 to-emerald-400/50"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-1/3 h-1/3 rounded-full ${
            isPlayer1 ? 'bg-blue-300' : 'bg-pink-300'
          } shadow-inner`}
        />
      </div>
    </motion.div>
  );
});

export default GamePiece;
