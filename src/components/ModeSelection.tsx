import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Brain, Cpu, Eye, Info, Scale } from 'lucide-react';
import type { OpponentMode, WatchMatchup } from '@/lib/types';
import ModeSelectionCard from './ModeSelectionCard';
import OpponentDetailsPanel from './OpponentDetailsPanel';
import WatchMatchSelection from './WatchMatchSelection';

interface ModeSelectionProps {
  watchMatchup: WatchMatchup;
  onSelect: (mode: OpponentMode, watchMatchup?: WatchMatchup) => void;
  onShowHowToPlay: () => void;
}

const MODE_OPTIONS = [
  {
    key: 'oracle',
    label: 'Oracle AI',
    description: 'The strongest opponent.',
    icon: Scale,
  },
  {
    key: 'classic',
    label: 'Classic AI',
    description: 'A careful opponent that plans ahead.',
    icon: Cpu,
  },
  {
    key: 'ml',
    label: 'Machine Learning AI',
    description: 'An experimental opponent with a less predictable style.',
    icon: Brain,
  },
  {
    key: 'watch',
    label: 'Watch a Match',
    description: 'Choose two opponents and watch them play.',
    icon: Eye,
  },
] as const;

const CARDS_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

export default function ModeSelection({
  watchMatchup,
  onSelect,
  onShowHowToPlay,
}: ModeSelectionProps) {
  const [watchSetupOpen, setWatchSetupOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <motion.section
      className="mt-6 w-full sm:mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
      aria-labelledby="opponent-selection-title"
    >
      <div
        className="surface-panel w-full rounded-2xl p-5 sm:p-7 lg:p-8"
        data-testid="ai-model-selection"
      >
        <div className="flex flex-col gap-4 border-b border-line pb-5 text-left sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
              Play or watch
            </div>
            <h2 id="opponent-selection-title" className="display-title text-3xl text-bone">
              Choose a game
            </h2>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-bone-muted transition-colors hover:text-bone"
              data-testid="opponent-details-button"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              About the AIs
            </button>
            <button
              type="button"
              onClick={onShowHowToPlay}
              className="inline-flex items-center gap-2 text-sm font-medium text-bone-muted transition-colors hover:text-bone"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              How to play
            </button>
          </div>
        </div>
        <motion.div
          className="grid gap-2.5 pt-5 sm:grid-cols-2"
          variants={CARDS_CONTAINER}
          initial="hidden"
          animate="show"
        >
          {MODE_OPTIONS.map(mode => (
            <ModeSelectionCard
              key={mode.key}
              icon={mode.icon}
              title={mode.label}
              description={mode.description}
              onClick={() => (mode.key === 'watch' ? setWatchSetupOpen(true) : onSelect(mode.key))}
              data-testid={`mode-select-${mode.key}`}
            />
          ))}
        </motion.div>
        <AnimatePresence>
          {watchSetupOpen && (
            <WatchMatchSelection
              initialMatchup={watchMatchup}
              onCancel={() => setWatchSetupOpen(false)}
              onStart={matchup => onSelect('watch', matchup)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {detailsOpen && <OpponentDetailsPanel onClose={() => setDetailsOpen(false)} />}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
