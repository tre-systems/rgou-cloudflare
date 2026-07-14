import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface ModeSelectionCardProps {
  icon: ElementType;
  title: string;
  description: string;
  subtitle: string;
  index: string;
  onClick: () => void;
  'data-testid'?: string;
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
} as const;

export default function ModeSelectionCard({
  icon: Icon,
  title,
  description,
  subtitle,
  index,
  onClick,
  'data-testid': dataTestId,
}: ModeSelectionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col rounded-xl border border-line bg-surface-inset p-5 text-left transition-colors duration-200 hover:border-line-strong hover:bg-surface-raised sm:p-6"
      variants={CARD_VARIANTS}
      whileHover={{ y: -3 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      aria-label={title}
      data-testid={dataTestId}
    >
      <div className="mb-6 flex items-start justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-faint" aria-hidden="true">
          {index}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-brass transition-colors group-hover:border-brass/60 group-hover:text-brass-light">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-auto">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight text-bone">{title}</h3>
          <ArrowUpRight className="h-4 w-4 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brass-light" />
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
          {subtitle}
        </div>
        <p className="mt-3 text-sm leading-6 text-bone-muted">{description}</p>
      </div>
    </motion.button>
  );
}
