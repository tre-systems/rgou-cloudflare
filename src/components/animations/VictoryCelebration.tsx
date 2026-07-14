import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';

interface VictoryCelebrationProps {
  position: { x: number; y: number };
  player: Player;
  onComplete: () => void;
}

export default function VictoryCelebration({
  position,
  player,
  onComplete,
}: VictoryCelebrationProps) {
  const isPlayer1 = player === 'player1';
  const colors = isPlayer1
    ? {
        primary: 'text-green-400',
        secondary: 'text-blue-400',
        bg: 'bg-green-500',
        border: 'border-green-400',
      }
    : {
        primary: 'text-pink-400',
        secondary: 'text-purple-400',
        bg: 'bg-pink-500',
        border: 'border-pink-400',
      };

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className={`absolute -translate-x-1/2 -translate-y-8 font-bold text-lg drop-shadow-lg ${colors.primary}`}
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -20, -30, -40],
        }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        {isPlayer1 ? 'FINISHED!' : 'AI FINISHED!'}
      </motion.div>

      <motion.div
        className={`absolute w-16 h-16 -translate-x-8 -translate-y-8 border-4 rounded-full ${colors.border}`}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1, 2], opacity: [1, 0.8, 0] }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${colors.bg}`}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos((i * 2 * Math.PI) / 8) * (35 + ((i * 11) % 26)),
            y: Math.sin((i * 2 * Math.PI) / 8) * (35 + ((i * 11) % 26)),
            opacity: [1, 1, 0.5, 0],
          }}
          transition={{
            duration: 2,
            ease: 'easeOut',
            delay: ((i * 5) % 8) * 0.05,
          }}
        />
      ))}

      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 bg-white rounded-full opacity-90"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        className={`absolute w-1 h-20 -translate-x-0.5 -translate-y-10 bg-gradient-to-b to-transparent ${
          isPlayer1 ? 'from-green-400' : 'from-pink-400'
        }`}
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: [0, 1, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {Array.from({ length: 4 }, (_, i) => (
        <motion.div
          key={i}
          className={`absolute w-3 h-3 rounded-full ${colors.bg}`}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos((i * 2 * Math.PI) / 4) * (50 + ((i * 17) % 31)),
            y: Math.sin((i * 2 * Math.PI) / 4) * (50 + ((i * 17) % 31)),
            opacity: [1, 1, 0.3, 0],
          }}
          transition={{
            duration: 2.5,
            ease: 'easeOut',
            delay: i * 0.14,
          }}
        />
      ))}
    </motion.div>
  );
}
