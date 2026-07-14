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
    classes: 'bg-[#477a91] border-[#9abfce]',
    center: 'border-[#d1e0e4]',
  },
  player2: {
    classes: 'bg-[#a75542] border-[#d89b87]',
    center: 'border-[#efd1c6]',
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
      style={{ boxShadow: 'inset 0 1px rgba(255,255,255,0.18), 0 2px 5px rgba(0,0,0,0.28)' }}
      whileHover={isClickable ? { scale: 1.08, y: -1 } : undefined}
      whileTap={isClickable ? { scale: 0.95 } : undefined}
      animate={
        isFinishing
          ? {
              scale: [1, 1.06, 1],
            }
          : {}
      }
      transition={
        isFinishing
          ? { duration: 0.45, ease: 'easeOut' }
          : { type: 'spring', stiffness: 500, damping: 34 }
      }
      data-testid={`game-piece-${player}-${isClickable ? 'clickable' : 'static'}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`h-[42%] w-[42%] rounded-full border ${colors.center}`} />
      </div>
    </motion.div>
  );
});

export default GamePiece;
