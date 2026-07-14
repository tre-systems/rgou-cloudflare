import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface RosetteLandingProps {
  position: { x: number; y: number };
  onComplete: () => void;
}

export default function RosetteLanding({ position, onComplete }: RosetteLandingProps) {
  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-11 whitespace-nowrap rounded-full border border-[#c7a65d]/60 bg-[#1d1f1b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e2ca91]"
        initial={{ y: 4, opacity: 0, scale: 0.94 }}
        animate={{ y: -8, opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: 1.25, ease: 'easeOut' }}
      >
        Extra turn
      </motion.div>
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 text-[#c7a65d]"
        initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
        animate={{ scale: [0.5, 1.25, 1], rotate: 0, opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <Star className="h-7 w-7" strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
}
