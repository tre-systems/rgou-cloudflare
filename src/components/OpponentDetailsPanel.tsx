import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface OpponentDetailsPanelProps {
  onClose: () => void;
}

const OPPONENT_DETAILS = [
  {
    name: 'Oracle AI',
    method: 'Value network · solved-game training',
    description:
      'The strongest choice. A small neural network compares legal positions using lessons from a solved version of the game.',
  },
  {
    name: 'Classic AI',
    method: 'Expectiminimax · depth 3',
    description:
      'A traditional search opponent. It looks ahead through possible moves and dice rolls before choosing what to play.',
  },
  {
    name: 'Machine Learning AI',
    method: 'Policy and value networks · self-play',
    description:
      'A neural-network opponent trained on simulated games. Its style is less consistent than Oracle or Classic.',
  },
] as const;

export default function OpponentDetailsPanel({ onClose }: OpponentDetailsPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/85 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-testid="opponent-details-panel"
    >
      <motion.div
        className="surface-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 sm:p-7"
        initial={{ scale: 0.98, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="opponent-details-title"
      >
        <div className="flex items-start justify-between gap-5 border-b border-line pb-5">
          <div>
            <h2 id="opponent-details-title" className="display-title text-3xl text-bone">
              About the AIs
            </h2>
            <p className="mt-2 text-sm text-bone-muted">They all follow the same rules.</p>
          </div>
          <motion.button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="icon-button shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Close AI details"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </motion.button>
        </div>

        <div className="divide-y divide-line">
          {OPPONENT_DETAILS.map(opponent => (
            <section key={opponent.name} className="py-5 first:pt-6 last:pb-1">
              <h3 className="text-base font-semibold text-bone">{opponent.name}</h3>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {opponent.method}
              </p>
              <p className="mt-3 text-sm leading-6 text-bone-muted">{opponent.description}</p>
            </section>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
