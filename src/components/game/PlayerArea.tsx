import { motion } from 'framer-motion';
import { CircleUserRound, Cpu } from 'lucide-react';
import { cn, getAIName, getAISubtitle } from '@/lib/utils';
import type { AISource, PiecePosition, Player } from '@/lib/types';
import GamePiece from './GamePiece';

interface PlayerAreaProps {
  player: Player;
  pieces: PiecePosition[];
  isCurrentPlayer: boolean;
  isAI: boolean;
  isStartMoveValid: boolean;
  validMoves: number[];
  onPieceClick: (pieceIndex: number) => void;
  aiType?: AISource | null;
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
        'surface-panel relative overflow-hidden rounded-xl p-3.5',
        isCurrentPlayer && 'player-area-current'
      )}
      layout
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {isAI ? (
            <Cpu className="h-4 w-4 shrink-0 text-[#dfa18c]" />
          ) : (
            <CircleUserRound className="h-4 w-4 shrink-0 text-[#a7cad7]" />
          )}
          <div className="flex min-w-0 items-baseline gap-2">
            <h3
              className={cn(
                'truncate text-sm font-semibold',
                isAI ? 'text-[#dfa18c]' : 'text-[#a7cad7]'
              )}
            >
              {isAI ? getAIName(aiType) : 'You'}
            </h3>
            {isAI && (
              <span className="hidden truncate text-[11px] text-[#8e9184] min-[380px]:inline">
                {getAISubtitle(aiType)}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isCurrentPlayer && (
            <span className="rounded-full border border-[#6d705f] bg-[#303229] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e2ca91]">
              Turn
            </span>
          )}
          <span className="font-mono text-xs text-[#c7a65d]">{finishedPieces.length}/7 home</span>
        </div>
      </div>

      <div className="surface-inset rounded-lg p-2">
        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              'rounded-md border border-transparent p-1 transition-colors duration-200',
              isStartMoveValid && 'start-area-valid'
            )}
            data-testid={`${player}-start-area`}
          >
            <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e9184]">
              Start
            </p>
            <div className="flex flex-nowrap gap-0.5 justify-center overflow-x-auto py-1">
              {pieces.map((p, i) => {
                const isPieceClickable = validMoves.includes(i) && player === 'player1';
                return p.square === -1 ? (
                  <motion.button
                    key={i}
                    type="button"
                    className="w-5 h-5"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onPieceClick(i)}
                    disabled={!isPieceClickable}
                    aria-label={`Move ${player === 'player1' ? 'your' : 'opponent'} piece ${i + 1} from start`}
                    data-testid={`${player}-start-piece-${i}`}
                  >
                    <GamePiece player={player} isClickable={isPieceClickable} />
                  </motion.button>
                ) : (
                  <div
                    key={i}
                    className="h-5 w-5 rounded-full border border-[#45483e] opacity-40"
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-md p-1">
            <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e9184]">
              Finish
            </p>
            <div
              className="flex flex-nowrap gap-0.5 justify-center overflow-x-auto py-1"
              data-testid={`${player}-finish-area`}
            >
              {Array.from({ length: 7 }, (_, i) => (
                <motion.div
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center relative"
                  style={{ background: i < finishedPieces.length ? '#34372f' : '#242620' }}
                  data-testid={
                    i < finishedPieces.length ? `${player}-finish-piece-${i}` : undefined
                  }
                >
                  {i < finishedPieces.length && (
                    <motion.div
                      className="w-full h-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      <GamePiece player={player} isClickable={false} isFinishing={true} />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
