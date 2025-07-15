'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn, isDevelopment } from '@/lib/utils';
import { ROSETTE_SQUARES } from '@/lib/types';
import GamePiece from './GamePiece';

interface GameSquareProps {
  squareIndex: number;
  piece: { player: 'player1' | 'player2'; square: number } | null;
  pieceIndex: number;
  isClickable: boolean;
  isFinishing: boolean;
  onPieceClick: (pieceIndex: number) => void;
}

export default function GameSquare({
  squareIndex,
  piece,
  pieceIndex,
  isClickable,
  isFinishing,
  onPieceClick,
}: GameSquareProps) {
  const isRosette = (ROSETTE_SQUARES as readonly number[]).includes(squareIndex);

  const handleSquareClick = () => {
    if (isClickable) {
      onPieceClick(pieceIndex);
    }
  };

  return (
    <motion.div
      className={cn(
        'aspect-square relative flex items-center justify-center overflow-hidden',
        'board-square rounded-lg',
        isRosette && 'rosette-glow',
        isClickable && 'clickable-square cursor-pointer'
      )}
      whileHover={{
        scale: 1.02,
        rotateY: isRosette ? 5 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-square-id={squareIndex}
      data-testid={`square-${squareIndex}`}
      onClick={handleSquareClick}
    >
      {isRosette && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Star className="w-6 h-6 text-amber-400 drop-shadow-lg" />
        </motion.div>
      )}

      {/* Board cell number in development mode */}
      {isDevelopment() && (
        <span className="absolute top-1 left-1 text-xs text-white/60 font-mono select-none pointer-events-none z-10">
          {squareIndex}
        </span>
      )}

      <AnimatePresence mode="wait">
        {piece && (
          <motion.div
            key={`${piece.player}-${pieceIndex}`}
            className="w-3/5 h-3/5 p-0.5"
            layoutId={`piece-${piece.player}-${pieceIndex}`}
            data-testid={`piece-${pieceIndex}`}
          >
            <GamePiece
              player={piece.player}
              isClickable={isClickable}
              isBeingCaptured={false}
              isFinishing={isFinishing || false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isClickable && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-green-400 pointer-events-none"
          animate={{
            boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 10px rgba(34, 197, 94, 0)'],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
