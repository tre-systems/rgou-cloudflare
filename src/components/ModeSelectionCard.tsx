import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ModeSelectionCardProps {
  icon: ElementType;
  title: string;
  description: string;
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
  onClick,
  'data-testid': dataTestId,
}: ModeSelectionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-20 w-full items-center gap-3 rounded-xl border border-line bg-surface-inset px-3 py-3 text-left transition-colors duration-200 hover:border-line-strong hover:bg-surface-raised sm:min-h-24 sm:gap-4 sm:px-5 sm:py-4"
      variants={CARD_VARIANTS}
      whileHover={{ y: -3 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      aria-label={title}
      data-testid={dataTestId}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-brass transition-colors group-hover:border-brass/60 group-hover:text-brass-light sm:h-10 sm:w-10">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold tracking-tight text-bone sm:text-lg">{title}</h3>
        <p className="mt-0.5 text-sm leading-5 text-bone-muted sm:mt-1">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brass-light" />
    </motion.button>
  );
}
