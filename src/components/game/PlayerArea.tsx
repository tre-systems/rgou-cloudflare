'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAIName, getAISubtitle } from '@/lib/utils';
import { Player, PiecePosition } from '@/lib/types';
import GamePiece from './GamePiece';

interface PlayerAreaProps {
  player: Player;
  pieces: PiecePosition[];
  isCurrentPlayer: boolean;
  isAI: boolean;
  isStartMoveValid: boolean;
  validMoves: number[];
  onPieceClick: (pieceIndex: number) => void;
  aiType?: 'client' | 'ml' | null;
}

export default function PlayerArea({
  player,
  pieces,
  isCurrentPlayer,
  isAI,
  isStartMoveValid,
  validMoves,
  onPieceClick,
  aiType = null,
}: PlayerAreaProps) {
  const finishedPieces = pieces.filter(p => p.square === 20);

  return (
    <motion.div
      className={cn(
        'glass rounded-lg p-3 relative overflow-hidden',
        isCurrentPlayer && 'ring-2 ring-white/30'
      )}
      animate={{
        boxShadow: isCurrentPlayer
          ? '0 0 20px rgba(99, 102, 241, 0.2)'
          : '0 0 8px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isAI ? (
            <Zap className="w-4 h-4 text-pink-400" />
          ) : (
            <Crown className="w-4 h-4 text-blue-400" />
          )}
          <h3
            className={cn(
              'font-bold text-base neon-text',
              isAI ? 'text-pink-400' : 'text-blue-400',
              isCurrentPlayer && 'animate-pulse'
            )}
          >
            {isAI ? getAIName(aiType) : 'You'}
          </h3>
        </div>
        {isAI && <div className="text-xs text-gray-400 -mt-1 mb-1">{getAISubtitle(aiType)}</div>}

        <div className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 font-bold text-sm">{finishedPieces.length}/7</span>
        </div>
      </div>

      <div className="glass-dark rounded-lg p-2">
        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              'rounded-md p-1 transition-all duration-300',
              isStartMoveValid && 'ring-2 ring-green-400 animate-pulse'
            )}
            data-testid={player === 'player1' ? 'player1-start-area' : 'player2-start-area'}
          >
            <p className={cn('text-xs text-white/70 font-semibold mb-1 text-center')}>START</p>
            <div className="flex flex-nowrap gap-0.5 justify-center overflow-x-auto py-1">
              {pieces.map((p, i) =>
                p.square === -1 ? (
                  <motion.div
                    key={i}
                    className="w-5 h-5"
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      validMoves.includes(i) && player === 'player1' && onPieceClick(i)
                    }
                    data-testid={`${player}-start-piece-${i}`}
                  >
                    <GamePiece
                      player={player}
                      isClickable={validMoves.includes(i) && player === 'player1'}
                      isBeingCaptured={false}
                      isFinishing={false}
                    />
                  </motion.div>
                ) : (
                  <div key={i} className="w-5 h-5 opacity-20 rounded-full border border-white/20" />
                )
              )}
            </div>
          </div>

          <div className="rounded-md p-1">
            <p className="text-xs text-white/70 font-semibold mb-1 text-center">FINISH</p>
            <div
              id={player === 'player1' ? 'player1-finish-area' : 'player2-finish-area'}
              className="flex flex-nowrap gap-0.5 justify-center overflow-x-auto py-1"
              data-testid={player === 'player1' ? 'player1-finish-area' : 'player2-finish-area'}
            >
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-5 h-5 rounded-full flex items-center justify-center relative"
                    style={{
                      background:
                        i < finishedPieces.length
                          ? 'linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))'
                          : 'rgba(255, 255, 255, 0.05)',
                    }}
                    animate={{
                      boxShadow:
                        i < finishedPieces.length ? '0 0 10px rgba(34, 197, 94, 0.3)' : 'none',
                    }}
                    data-testid={
                      i < finishedPieces.length ? `${player}-finish-piece-${i}` : undefined
                    }
                  >
                    {i < finishedPieces.length && (
                      <motion.div
                        className="w-full h-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <GamePiece
                          player={player}
                          isClickable={false}
                          isBeingCaptured={false}
                          isFinishing={true}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {isCurrentPlayer && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.div>
  );
}
