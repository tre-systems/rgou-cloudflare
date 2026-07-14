import { motion } from 'framer-motion';
import { Cpu, Trophy } from 'lucide-react';
import { getAISubtitle } from '@/lib/utils';
import type { GameMode, GameState } from '@/lib/types';
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
  const winnerName = isPlayer1Winner ? 'Classic' : 'Machine Learning';

  const title = isWatchMode ? `${winnerName} wins` : isPlayer1Winner ? 'You won' : 'The AI won';
  const message = isWatchMode
    ? `${winnerName} brought every piece home first.`
    : isPlayer1Winner
      ? 'Every piece made it safely around the board.'
      : 'A close race. Choose an opponent and play again.';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/88 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      data-testid="game-completion-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-completion-title"
    >
      <motion.div
        className="surface-panel w-full max-w-sm rounded-2xl p-7 text-center"
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line-strong bg-surface-raised text-brass">
          {isPlayer1Winner ? (
            <Trophy className="h-6 w-6" strokeWidth={1.6} />
          ) : (
            <Cpu className="h-6 w-6" strokeWidth={1.6} />
          )}
        </div>

        {isWatchMode && (
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {getAISubtitle(isPlayer1Winner ? 'classic' : 'ml')}
          </div>
        )}
        <h2
          id="game-completion-title"
          className="display-title text-4xl text-bone"
          data-testid="game-completion-title"
        >
          {title}
        </h2>
        <p
          className="mx-auto mt-3 max-w-xs text-sm leading-6 text-bone-muted"
          data-testid="game-completion-message"
        >
          {message}
        </p>

        {!isWatchMode && (
          <div
            className="surface-inset mt-6 grid grid-cols-3 divide-x divide-line rounded-xl px-3 py-4"
            data-testid="stats-panel"
          >
            <div>
              <div className="font-mono text-xl text-lapis-light" data-testid="wins-count">
                {gameStats.wins}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">Wins</div>
            </div>
            <div>
              <div className="font-mono text-xl text-clay-light" data-testid="losses-count">
                {gameStats.losses}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">Losses</div>
            </div>
            <div data-testid="games-played">
              <div className="font-mono text-xl text-brass-light">
                {gameStats.gamesPlayed > 0
                  ? Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)
                  : 0}
                %
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                Win rate
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          autoFocus
          onClick={onResetGame}
          className="mt-6 w-full rounded-lg border border-brass bg-brass px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-brass-light hover:bg-brass-light"
          data-testid="reset-game-button"
        >
          Choose another opponent
        </button>
      </motion.div>
    </motion.div>
  );
}
