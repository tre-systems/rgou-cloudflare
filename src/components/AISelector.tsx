'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap } from 'lucide-react';

interface AISelectorProps {
  aiSource: 'server' | 'client' | 'ml';
  onAiSourceChange: (source: 'server' | 'client' | 'ml') => void;
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
    value: 'server' as const,
    label: 'Server AI',
    description: 'Cloudflare Worker (4-ply search)',
    icon: Zap,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
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
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">AI Opponent</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {aiOptions.map(option => {
          const Icon = option.icon;
          const isSelected = aiSource === option.value;

          return (
            <motion.button
              key={option.value}
              onClick={() => !disabled && onAiSourceChange(option.value)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${
                  isSelected
                    ? `${option.bgColor} ${option.borderColor} ${option.color}`
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              `}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${isSelected ? option.color : 'text-gray-400'}`} />
                <div className="text-left">
                  <div
                    className={`text-xs font-medium ${isSelected ? option.color : 'text-gray-300'}`}
                  >
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${option.bgColor} border-2 border-white`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {aiSource === 'ml' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-purple-400/10 border border-purple-400/20 rounded text-xs text-purple-300"
        >
          <Brain className="inline w-3 h-3 mr-1" />
          ML AI uses neural networks trained on expert gameplay. May take a moment to load.
        </motion.div>
      )}
    </div>
  );
}
