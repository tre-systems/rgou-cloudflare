import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn, isDevelopment } from '@/lib/utils';
import { ROSETTE_SQUARES } from '@/lib/types';
import type { PiecePosition } from '@/lib/types';
import GamePiece from './GamePiece';

interface GameSquareProps {
  squareIndex: number;
  piece: PiecePosition | null;
  pieceIndex: number;
  isClickable: boolean;
  onPieceClick: (pieceIndex: number) => void;
}

export default function GameSquare({
  squareIndex,
  piece,
  pieceIndex,
  isClickable,
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
        'board-square',
        isRosette && 'rosette-square',
        isClickable && 'clickable-square cursor-pointer'
      )}
      whileTap={isClickable ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      data-square-id={squareIndex}
      data-testid={`square-${squareIndex}`}
      onClick={handleSquareClick}
      onKeyDown={event => {
        if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onPieceClick(pieceIndex);
        }
      }}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable ? `Move piece ${pieceIndex + 1} from square ${squareIndex}` : undefined
      }
    >
      {isRosette && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Star className="h-5 w-5 text-brass" strokeWidth={1.5} />
        </div>
      )}

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
            <GamePiece player={piece.player} isClickable={isClickable} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
