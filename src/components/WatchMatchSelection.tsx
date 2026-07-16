import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WatchAISource, WatchMatchup } from '@/lib/types';

const WATCH_OPTIONS = [
  { source: 'oracle', label: 'Oracle', detail: 'Strongest' },
  { source: 'classic', label: 'Classic', detail: 'Plans ahead' },
  { source: 'ml', label: 'ML AI', detail: 'Unpredictable' },
] as const satisfies readonly {
  source: WatchAISource;
  label: string;
  detail: string;
}[];

interface WatchMatchSelectionProps {
  initialMatchup: WatchMatchup;
  onCancel: () => void;
  onStart: (matchup: WatchMatchup) => void;
}

interface SideSelectionProps {
  label: string;
  player: keyof WatchMatchup;
  selected: WatchAISource;
  onSelect: (source: WatchAISource) => void;
}

function SideSelection({ label, player, selected, onSelect }: SideSelectionProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </legend>
      <div className="grid gap-2" data-testid={`watch-${player}-options`}>
        {WATCH_OPTIONS.map(option => {
          const isSelected = selected === option.source;
          return (
            <button
              key={option.source}
              type="button"
              className={cn(
                'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'border-brass/70 bg-brass/10 text-bone'
                  : 'border-line bg-surface-inset text-bone-muted hover:border-line-strong hover:text-bone'
              )}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.source)}
              data-testid={`watch-${player}-${option.source}`}
            >
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-[11px] text-muted">{option.detail}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function WatchMatchSelection({
  initialMatchup,
  onCancel,
  onStart,
}: WatchMatchSelectionProps) {
  const [matchup, setMatchup] = useState(initialMatchup);

  const select = (player: keyof WatchMatchup, source: WatchAISource) => {
    setMatchup(current => ({ ...current, [player]: source }));
  };

  return (
    <motion.div
      className="mt-5 rounded-xl border border-line bg-surface-raised p-5 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      data-testid="watch-match-selection"
    >
      <div className="flex items-start justify-between gap-5 border-b border-line pb-5">
        <div>
          <h3 className="text-lg font-semibold text-bone">Set up the match</h3>
          <p className="mt-1 text-sm text-bone-muted">Choose an AI for each side.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-bone"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancel
        </button>
      </div>

      <div className="grid gap-6 py-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <SideSelection
          label="Player 1"
          player="player1"
          selected={matchup.player1}
          onSelect={source => select('player1', source)}
        />
        <span className="hidden font-mono text-xs uppercase tracking-[0.18em] text-faint sm:block">
          vs
        </span>
        <SideSelection
          label="Player 2"
          player="player2"
          selected={matchup.player2}
          onSelect={source => select('player2', source)}
        />
      </div>

      <div className="flex justify-end border-t border-line pt-5">
        <button
          type="button"
          onClick={() => onStart(matchup)}
          className="inline-flex items-center gap-2 rounded-lg border border-brass bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brass-light hover:bg-brass-light"
          data-testid="watch-match-start"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          Watch match
        </button>
      </div>
    </motion.div>
  );
}
