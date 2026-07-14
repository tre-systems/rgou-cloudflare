import { motion } from 'framer-motion';
import { Brain, Cpu, Eye } from 'lucide-react';
import type { OpponentMode } from '@/lib/types';
import ModeSelectionCard from './ModeSelectionCard';

interface ModeSelectionProps {
  onSelect: (mode: OpponentMode) => void;
}

const MODE_OPTIONS = [
  {
    key: 'classic',
    label: 'Classic AI',
    description: 'A strategic opponent using a classic game AI algorithm.',
    subtitle: 'Expectiminimax algorithm',
    icon: Cpu,
    colorClass: 'text-blue-400',
    borderColorClass: 'border-blue-400/30 hover:border-blue-400/60',
  },
  {
    key: 'ml',
    label: 'Machine Learning AI',
    description: 'A modern opponent trained through thousands of self-play games.',
    subtitle: 'Neural network model',
    icon: Brain,
    colorClass: 'text-purple-400',
    borderColorClass: 'border-purple-400/30 hover:border-purple-400/60',
  },
  {
    key: 'watch',
    label: 'Watch a Match',
    description: 'Sit back and watch the Classic AI challenge the ML AI.',
    subtitle: 'AI vs AI battle',
    icon: Eye,
    colorClass: 'text-orange-400',
    borderColorClass: 'border-orange-400/30 hover:border-orange-400/60',
  },
] as const;

export default function ModeSelection({ onSelect }: ModeSelectionProps) {
  return (
    <motion.section
      className="mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      aria-labelledby="opponent-selection-title"
    >
      <div
        className="glass-dark w-full space-y-4 rounded-2xl p-6 text-center md:p-8"
        data-testid="ai-model-selection"
      >
        <h2 id="opponent-selection-title" className="text-xl font-bold text-white">
          Select Your Opponent
        </h2>
        <p className="text-sm text-gray-300">Choose an AI to challenge, or watch them battle.</p>
        <div className="space-y-3 pt-2">
          {MODE_OPTIONS.map(mode => (
            <ModeSelectionCard
              key={mode.key}
              icon={mode.icon}
              title={mode.label}
              description={mode.description}
              subtitle={mode.subtitle}
              onClick={() => onSelect(mode.key)}
              colorClass={mode.colorClass}
              borderColorClass={mode.borderColorClass}
              data-testid={`mode-select-${mode.key}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
