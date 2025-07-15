'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dice6, Crown, Star, Zap, Trophy, ArrowRight } from 'lucide-react';

interface HowToPlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayPanel({ isOpen, onClose }: HowToPlayPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="help-panel"
        >
          <motion.div
            className="glass mystical-glow rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white neon-text">How to Play</h2>
              <motion.button
                onClick={onClose}
                className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="space-y-6 text-white/90">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-amber-400" />
                  Objective
                </h3>
                <p className="text-sm leading-relaxed">
                  Move all 7 of your pieces around the board and off the finish before your
                  opponent. The first player to get all pieces home wins!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Dice6 className="w-5 h-5 mr-2 text-blue-400" />
                  Rolling Dice
                </h3>
                <p className="text-sm leading-relaxed mb-2">
                  Dice are rolled automatically for you at the start of your turn. The game uses 4
                  tetrahedral dice (binary dice). The number of marked corners facing up determines
                  your move:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="glass-dark p-2 rounded">0 corners = 0 moves</div>
                  <div className="glass-dark p-2 rounded">1 corner = 1 move</div>
                  <div className="glass-dark p-2 rounded">2 corners = 2 moves</div>
                  <div className="glass-dark p-2 rounded">3 corners = 3 moves</div>
                  <div className="glass-dark p-2 rounded">4 corners = 4 moves</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2 text-green-400" />
                  Movement
                </h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Move pieces along your designated track from start to finish
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    You must move a piece if possible, even if it&apos;s not advantageous
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    If no moves are possible, your turn is skipped
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-red-400" />
                  Combat
                </h3>
                <p className="text-sm leading-relaxed">
                  Landing on a square occupied by an opponent&apos;s piece sends it back to the
                  start. This does not apply to squares with a rosette (star).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-amber-400" />
                  Rosettes
                </h3>
                <p className="text-sm leading-relaxed">
                  The starred squares are safe zones and grant an extra turn when landed on. Pieces
                  on rosette squares cannot be captured.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Winning
                </h3>
                <p className="text-sm leading-relaxed">
                  The first player to move all 7 pieces off the board wins the game. Pieces must be
                  moved exactly to the finish - no overshooting!
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/60 text-center">
                  The Royal Game of Ur dates back to 2600-2400 BCE and was discovered in the Royal
                  Cemetery at Ur. The rules were deciphered from a cuneiform tablet by Irving Finkel
                  at the British Museum.
                </p>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
