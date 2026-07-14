import { motion } from 'framer-motion';

interface CaptureExplosionProps {
  position: { x: number; y: number };
  onComplete: () => void;
}

export default function CaptureExplosion({ position, onComplete }: CaptureExplosionProps) {
  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.25, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-10 whitespace-nowrap rounded-full border border-clay/60 bg-ink-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-clay-light"
        initial={{ y: 4, opacity: 0, scale: 0.94 }}
        animate={{ y: -8, opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: 1.15, ease: 'easeOut' }}
      >
        Captured
      </motion.div>
      <motion.div
        className="absolute h-10 w-10 -translate-x-5 -translate-y-5 rounded-full border border-clay"
        initial={{ scale: 0.45, opacity: 0.8 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      />
    </motion.div>
  );
}
