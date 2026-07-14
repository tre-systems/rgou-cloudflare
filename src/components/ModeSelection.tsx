import { motion } from 'framer-motion';
import { BookOpen, Brain, Cpu, Eye } from 'lucide-react';
import type { OpponentMode } from '@/lib/types';
import ModeSelectionCard from './ModeSelectionCard';

interface ModeSelectionProps {
  onSelect: (mode: OpponentMode) => void;
  onShowHowToPlay: () => void;
}

const MODE_OPTIONS = [
  {
    key: 'classic',
    index: '01',
    label: 'Classic AI',
    description: 'A deliberate tactical opponent that searches the possible outcomes of each move.',
    subtitle: 'Expectiminimax · depth 4',
    icon: Cpu,
  },
  {
    key: 'ml',
    index: '02',
    label: 'Machine Learning AI',
    description: 'A quick, instinctive opponent trained on positions generated through self-play.',
    subtitle: 'Neural network',
    icon: Brain,
  },
  {
    key: 'watch',
    index: '03',
    label: 'Watch a Match',
    description:
      'See the search-based and neural opponents play a complete game against each other.',
    subtitle: 'Classic vs machine learning',
    icon: Eye,
  },
] as const;

export default function ModeSelection({ onSelect, onShowHowToPlay }: ModeSelectionProps) {
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
        <div className="flex flex-col gap-4 border-b border-[#45483e] pb-6 text-left sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7a65d]">
              Choose a table
            </div>
            <h2 id="opponent-selection-title" className="display-title text-3xl text-[#eee7d8]">
              Select your opponent
            </h2>
          </div>
          <button
            type="button"
            onClick={onShowHowToPlay}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-[#bdb9ad] transition-colors hover:text-[#eee7d8] sm:self-auto"
          >
            <BookOpen className="h-4 w-4" />
            How to play
          </button>
        </div>
        <div className="grid gap-3 pt-5 md:grid-cols-3">
          {MODE_OPTIONS.map(mode => (
            <ModeSelectionCard
              key={mode.key}
              icon={mode.icon}
              title={mode.label}
              description={mode.description}
              subtitle={mode.subtitle}
              index={mode.index}
              onClick={() => onSelect(mode.key)}
              data-testid={`mode-select-${mode.key}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
