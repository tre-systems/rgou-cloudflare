import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Brain, Cpu, Eye, Scale } from 'lucide-react';
import type { OpponentMode, WatchMatchup } from '@/lib/types';
import ModeSelectionCard from './ModeSelectionCard';
import WatchMatchSelection from './WatchMatchSelection';

interface ModeSelectionProps {
  watchMatchup: WatchMatchup;
  onSelect: (mode: OpponentMode, watchMatchup?: WatchMatchup) => void;
  onShowHowToPlay: () => void;
}

const MODE_OPTIONS = [
  {
    key: 'oracle',
    index: '01',
    label: 'Oracle AI',
    description: 'A compact value network trained from the solved game.',
    subtitle: 'Solved-game model',
    icon: Scale,
  },
  {
    key: 'classic',
    index: '02',
    label: 'Classic AI',
    description: 'A deliberate tactical opponent that searches the possible outcomes of each move.',
    subtitle: 'Expectiminimax · depth 4',
    icon: Cpu,
  },
  {
    key: 'ml',
    index: '03',
    label: 'Machine Learning AI',
    description: 'A quick, instinctive opponent trained on positions generated through self-play.',
    subtitle: 'Neural network',
    icon: Brain,
  },
  {
    key: 'watch',
    index: '04',
    label: 'Watch a Match',
    description: 'Choose any two AI opponents and watch them play a complete game.',
    subtitle: 'AI vs AI',
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

  return (
    <motion.section
      className="mt-8 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
      aria-labelledby="opponent-selection-title"
    >
      <div
        className="surface-panel w-full rounded-2xl p-5 sm:p-7 lg:p-8"
        data-testid="ai-model-selection"
      >
        <div className="flex flex-col gap-4 border-b border-line pb-6 text-left sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
              Play or watch
            </div>
            <h2 id="opponent-selection-title" className="display-title text-3xl text-bone">
              Choose a game
            </h2>
          </div>
          <button
            type="button"
            onClick={onShowHowToPlay}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-bone-muted transition-colors hover:text-bone sm:self-auto"
          >
            <BookOpen className="h-4 w-4" />
            How to play
          </button>
        </div>
        <motion.div
          className="grid gap-3 pt-5 md:grid-cols-2 lg:grid-cols-4"
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
              subtitle={mode.subtitle}
              index={mode.index}
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
      </div>
    </motion.section>
  );
}
