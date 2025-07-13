'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CaptureExplosionProps {
  position: { x: number; y: number };
}

export default function CaptureExplosion({ position }: CaptureExplosionProps) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5 }}
    >
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-8 text-red-400 font-bold text-lg drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -20, -30, -40],
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        CAPTURED!
      </motion.div>

      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-4 border-red-500 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1, 2], opacity: [1, 0.8, 0] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'absolute w-3 h-3 rounded-full',
            i % 3 === 0 ? 'bg-red-500' : i % 3 === 1 ? 'bg-orange-500' : 'bg-yellow-500'
          )}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos(i * (360 / 12) * (Math.PI / 180)) * (30 + Math.random() * 30),
            y: Math.sin(i * (360 / 12) * (Math.PI / 180)) * (30 + Math.random() * 30),
            opacity: [1, 1, 0.5, 0],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
            delay: Math.random() * 0.3,
          }}
        />
      ))}

      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 bg-white rounded-full opacity-90"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className="absolute w-1 h-16 -translate-x-0.5 -translate-y-8 bg-gradient-to-b from-yellow-300 to-red-500"
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: [0, 1, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
    </motion.div>
  );
}
