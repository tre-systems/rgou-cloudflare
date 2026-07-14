import { motion, AnimatePresence } from 'framer-motion';
import { cn, getAIName } from '@/lib/utils';
import type { AISource, GameState } from '@/lib/types';
import { Dice6, Crown, Zap, Trophy, XCircle, Brain, Cpu } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  aiThinking: boolean;
  watchMode?: boolean;
  aiSourceP1?: AISource | null;
  aiSourceP2?: AISource;
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
        color: gameState.winner === 'player1' ? 'text-brass-light' : 'text-clay-light',
      };
    }

    if (watchMode) {
      const currentAISource = gameState.currentPlayer === 'player1' ? aiSourceP1 : aiSourceP2;
      return {
        text: `${getAIName(currentAISource)}'s turn`,
        icon: currentAISource === 'ml' ? Brain : Cpu,
        color: currentAISource === 'ml' ? 'text-clay-light' : 'text-lapis-light',
      };
    }

    if (gameState.currentPlayer === 'player1') {
      if (gameState.diceRoll === null) {
        return {
          text: 'Roll the dice!',
          icon: Dice6,
          color: 'text-lapis-light',
        };
      }
      if (!gameState.canMove) {
        return {
          text: 'No valid moves',
          icon: XCircle,
          color: 'text-clay-light',
        };
      }
      return {
        text: 'Your turn',
        icon: Crown,
        color: 'text-lapis-light',
      };
    }

    if (aiThinking) {
      return {
        text: 'AI thinking...',
        icon: Zap,
        color: 'text-clay-light',
      };
    }
    return {
      text: 'AI turn',
      icon: Zap,
      color: 'text-clay-light',
    };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="relative mt-1 flex h-11 flex-col justify-start pt-1">
      <div className="flex h-7 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={status.text}
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <StatusIcon className={cn('h-4 w-4', status.color)} data-testid="game-status-icon" />
            <span
              className={cn('text-base font-semibold tracking-tight', status.color)}
              data-testid="game-status-text"
              aria-live="polite"
            >
              {status.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {aiThinking && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 flex justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={i}
                className="h-1 w-1 rounded-full bg-clay-light"
                animate={{
                  y: [0, -3, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  delay: i * 0.16,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
