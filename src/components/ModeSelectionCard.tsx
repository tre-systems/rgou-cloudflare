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
      className="group flex h-full w-full flex-col rounded-xl border border-[#45483e] bg-[#1b1d19] p-5 text-left transition-colors duration-200 hover:border-[#777967] hover:bg-[#292c25] sm:p-6"
      whileHover={{ y: -3 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      aria-label={title}
      data-testid={dataTestId}
    >
      <div className="mb-6 flex items-start justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-[#777a6d]" aria-hidden="true">
          {index}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#45483e] text-[#c7a65d] transition-colors group-hover:border-[#c7a65d]/60 group-hover:text-[#e2ca91]">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-auto">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight text-[#eee7d8]">{title}</h3>
          <ArrowUpRight className="h-4 w-4 text-[#777a6d] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#e2ca91]" />
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8e9184]">
          {subtitle}
        </div>
        <p className="mt-3 text-sm leading-6 text-[#bdb9ad]">{description}</p>
      </div>
    </motion.button>
  );
}
