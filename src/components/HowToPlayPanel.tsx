import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dice6, Crown, Star, Zap, Trophy, ArrowRight } from 'lucide-react';

interface HowToPlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayPanel({ isOpen, onClose }: HowToPlayPanelProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0f0d]/85 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="help-panel"
        >
          <motion.div
            className="surface-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-5 sm:p-7"
            initial={{ scale: 0.98, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-play-title"
          >
            <div className="mb-7 flex items-center justify-between border-b border-[#45483e] pb-5">
              <h2 id="how-to-play-title" className="display-title text-3xl text-[#eee7d8]">
                How to Play
              </h2>
              <motion.button
                type="button"
                onClick={onClose}
                className="icon-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close how to play"
                autoFocus
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            </div>

            <div className="space-y-7 text-[#c9c5b9]">
              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold text-[#eee7d8]">
                  <Crown className="mr-2 h-4 w-4 text-[#c7a65d]" />
                  Objective
                </h3>
                <p className="text-sm leading-relaxed">
                  Move all 7 of your pieces around the board and off the finish before your
                  opponent. The first player to get all pieces home wins!
                </p>
              </div>

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold text-[#eee7d8]">
                  <Dice6 className="mr-2 h-4 w-4 text-[#a7cad7]" />
                  Rolling Dice
                </h3>
                <p className="text-sm leading-relaxed mb-2">
                  Dice are rolled automatically for you at the start of your turn. The game uses 4
                  tetrahedral dice (binary dice). The number of marked corners facing up determines
                  your move:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Array.from({ length: 5 }, (_, roll) => (
                    <div key={roll} className="surface-inset rounded-md p-2.5">
                      {roll} marked = {roll} {roll === 1 ? 'space' : 'spaces'}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold text-[#eee7d8]">
                  <ArrowRight className="mr-2 h-4 w-4 text-[#a7cad7]" />
                  Movement
                </h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span
                      className="mt-2 mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c7a65d]"
                      aria-hidden="true"
                    />
                    Move pieces along your designated track from start to finish
                  </li>
                  <li className="flex items-start">
                    <span
                      className="mt-2 mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c7a65d]"
                      aria-hidden="true"
                    />
                    You must move a piece if possible, even if it&apos;s not advantageous
                  </li>
                  <li className="flex items-start">
                    <span
                      className="mt-2 mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c7a65d]"
                      aria-hidden="true"
                    />
                    If no moves are possible, your turn is skipped
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold text-[#eee7d8]">
                  <Zap className="mr-2 h-4 w-4 text-[#dfa18c]" />
                  Combat
                </h3>
                <p className="text-sm leading-relaxed">
                  Landing on a square occupied by an opponent&apos;s piece sends it back to the
                  start. This does not apply to squares with a rosette (star).
                </p>
              </div>

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold text-[#eee7d8]">
                  <Star className="mr-2 h-4 w-4 text-[#c7a65d]" />
                  Rosettes
                </h3>
                <p className="text-sm leading-relaxed">
                  The starred squares are safe zones and grant an extra turn when landed on. Pieces
                  on rosette squares cannot be captured.
                </p>
              </div>

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold text-[#eee7d8]">
                  <Trophy className="mr-2 h-4 w-4 text-[#c7a65d]" />
                  Winning
                </h3>
                <p className="text-sm leading-relaxed">
                  The first player to move all 7 pieces off the board wins the game. Pieces must be
                  moved exactly to the finish - no overshooting!
                </p>
              </div>

              <div className="border-t border-[#45483e] pt-5">
                <p className="text-center text-xs leading-5 text-[#8e9184]">
                  Boards from the Royal Cemetery at Ur date to the early third millennium BCE.
                  Irving Finkel decoded a later cuneiform tablet describing the game.
                </p>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#c7a65d] bg-[#c7a65d] px-7 py-2.5 text-sm font-semibold text-[#191a17] transition-colors hover:border-[#e2ca91] hover:bg-[#e2ca91]"
                  data-testid="help-close"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
