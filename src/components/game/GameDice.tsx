'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Dice6 } from 'lucide-react';
import { GameState } from '@/lib/types';

interface GameDiceProps {
  gameState: GameState;
  onRollDice?: () => void;
}

export default function GameDice({ gameState, onRollDice }: GameDiceProps) {
  const canRoll = gameState.currentPlayer === 'player1' && gameState.diceRoll === null;

  if (gameState.diceRoll === null) {
    return (
      <motion.button
        onClick={onRollDice}
        className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={canRoll ? { scale: 1.05 } : {}}
        whileTap={canRoll ? { scale: 0.95 } : {}}
        disabled={!canRoll}
        data-testid="roll-dice"
      >
        <Dice6 className="w-4 h-4" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg border border-white/20"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-testid="roll-dice"
    >
      <span className="text-white font-bold text-sm">{gameState.diceRoll}</span>
    </motion.div>
  );
}
