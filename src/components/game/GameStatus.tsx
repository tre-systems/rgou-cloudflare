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
        color: gameState.winner === 'player1' ? 'text-[#e2ca91]' : 'text-[#dfa18c]',
      };
    }

    if (watchMode) {
      const currentAISource = gameState.currentPlayer === 'player1' ? aiSourceP1 : aiSourceP2;
      return {
        text: `${getAIName(currentAISource)}'s turn`,
        icon: currentAISource === 'ml' ? Brain : Cpu,
        color: currentAISource === 'ml' ? 'text-[#dfa18c]' : 'text-[#a7cad7]',
      };
    }

    if (gameState.currentPlayer === 'player1') {
      if (gameState.diceRoll === null) {
        return {
          text: 'Roll the dice!',
          icon: Dice6,
          color: 'text-[#a7cad7]',
        };
      }
      if (!gameState.canMove) {
        return {
          text: 'No valid moves',
          icon: XCircle,
          color: 'text-[#dfa18c]',
        };
      }
      return {
        text: 'Your turn',
        icon: Crown,
        color: 'text-[#a7cad7]',
      };
    }

    if (aiThinking) {
      return {
        text: 'AI thinking...',
        icon: Zap,
        color: 'text-[#dfa18c]',
      };
    }
    return {
      text: 'AI turn',
      icon: Zap,
      color: 'text-[#dfa18c]',
    };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="relative mt-1 flex h-11 flex-col justify-start pt-1">
      <motion.div
        className="flex h-7 items-center justify-center gap-2"
        animate={{ opacity: aiThinking ? [0.72, 1, 0.72] : 1 }}
        transition={{ repeat: aiThinking ? Infinity : 0, duration: 1.4, ease: 'easeInOut' }}
      >
        <StatusIcon className={cn('w-4 h-4', status.color)} data-testid="game-status-icon" />
        <span
          className={cn('text-base font-semibold tracking-tight', status.color)}
          data-testid="game-status-text"
          aria-live="polite"
        >
          {status.text}
        </span>
      </motion.div>

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
                className="h-1 w-1 rounded-full bg-[#dfa18c]"
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
