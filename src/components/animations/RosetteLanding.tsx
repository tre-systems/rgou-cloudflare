'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface RosetteLandingProps {
  position: { x: number; y: number };
}

export default function RosetteLanding({ position }: RosetteLandingProps) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
    >
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-10 text-amber-400 font-bold text-lg drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -15, -20, -30],
        }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      >
        ROSETTE!
      </motion.div>

      <motion.div
        className="absolute -translate-x-1/2 -translate-y-4 text-amber-300 font-semibold text-sm drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1, 0.9, 0],
          y: [0, -10, -15, -25],
        }}
        transition={{ duration: 2.2, ease: 'easeOut', delay: 0.3 }}
      >
        Extra Turn!
      </motion.div>

      <motion.div
        className="absolute -translate-x-4 -translate-y-4"
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1.5, 1.2, 0],
          rotate: [0, 720],
        }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
      </motion.div>

      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-2 border-amber-400 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1, 1.5],
          opacity: [1, 0.6, 0],
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 border-2 border-yellow-300 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.2, 2],
          opacity: [1, 0.7, 0],
        }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
      />

      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full"
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos(i * (360 / 16) * (Math.PI / 180)) * (25 + Math.random() * 15),
            y: Math.sin(i * (360 / 16) * (Math.PI / 180)) * (25 + Math.random() * 15),
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: 1.8,
            ease: 'easeOut',
            delay: Math.random() * 0.5,
          }}
        />
      ))}

      <motion.div
        className="absolute w-20 h-20 -translate-x-10 -translate-y-10 bg-amber-400 rounded-full opacity-20"
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1, 1.5, 0],
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full"
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos(i * (360 / 6) * (Math.PI / 180)) * (40 + Math.random() * 20),
            y: Math.sin(i * (360 / 6) * (Math.PI / 180)) * (40 + Math.random() * 20),
            opacity: [1, 1, 0.4, 0],
          }}
          transition={{
            duration: 2.2,
            ease: 'easeOut',
            delay: Math.random() * 0.8,
          }}
        />
      ))}
    </motion.div>
  );
}
