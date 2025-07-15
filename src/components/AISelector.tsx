'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Brain } from 'lucide-react';

interface AISelectorProps {
  aiSource: 'client' | 'ml';
  onAiSourceChange: (aiSource: 'client' | 'ml') => void;
  disabled?: boolean;
}

const aiOptions = [
  {
    value: 'client' as const,
    label: 'Classic AI',
    description: 'Expectiminimax (classic) algorithm (6-ply search)',
    icon: Cpu,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    value: 'ml' as const,
    label: 'ML AI',
    description: 'Neural network-based AI',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
  },
];

export default function AISelector({
  aiSource,
  onAiSourceChange,
  disabled = false,
}: AISelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/90">Choose AI Opponent</h3>
      <div className="grid gap-3">
        {aiOptions.map(option => (
          <motion.button
            key={option.value}
            onClick={() => onAiSourceChange(option.value)}
            disabled={disabled}
            className={`relative p-4 rounded-lg border-2 transition-all ${
              aiSource === option.value
                ? `${option.borderColor} ${option.bgColor}`
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${option.bgColor}`}>
                <option.icon className={`w-5 h-5 ${option.color}`} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-medium ${option.color}`}>{option.label}</div>
                <div className="text-xs text-white/70">{option.description}</div>
              </div>
            </div>
            {aiSource === option.value && (
              <motion.div
                layoutId="activeAI"
                className={`absolute inset-0 rounded-lg border-2 ${option.borderColor}`}
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
