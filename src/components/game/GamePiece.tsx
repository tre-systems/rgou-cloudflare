import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';

interface GamePieceProps {
  player: Player;
  isClickable: boolean;
  isFinishing?: boolean;
}

const PLAYER_COLORS = {
  player1: {
    classes: 'bg-blue-500 border-blue-400 shadow-blue-500/50',
    center: 'bg-blue-300',
    glow: 'rgba(96, 165, 250, 0.9)',
  },
  player2: {
    classes: 'bg-pink-500 border-pink-400 shadow-pink-500/50',
    center: 'bg-pink-300',
    glow: 'rgba(244, 114, 182, 0.9)',
  },
} as const;

const GamePiece = memo(function GamePiece({
  player,
  isClickable,
  isFinishing = false,
}: GamePieceProps) {
  const colors = PLAYER_COLORS[player];

  return (
    <motion.div
      className={`relative h-full w-full overflow-hidden rounded-full border-2 ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } ${colors.classes}`}
      whileHover={isClickable ? { scale: 1.1, boxShadow: `0 0 20px ${colors.glow}` } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      animate={
        isFinishing
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
        isFinishing
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
        <div className={`h-1/3 w-1/3 rounded-full shadow-inner ${colors.center}`} />
      </div>
    </motion.div>
  );
});

export default GamePiece;
