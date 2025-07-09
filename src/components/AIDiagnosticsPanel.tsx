'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronRight } from 'lucide-react';
import { AIResponse, MoveEvaluation } from '@/lib/ai-types';
import { GameState } from '@/lib/types';
import {
  calculateBoardControl,
  calculateGamePhase,
  calculatePiecePositions,
} from '@/lib/diagnostics';

interface AIDiagnosticsPanelProps {
  lastAIDiagnostics: AIResponse;
  lastAIMoveDuration: number | null;
  isOpen: boolean;
  onToggle: () => void;
  gameState: GameState;
}

export default function AIDiagnosticsPanel({
  lastAIDiagnostics,
  lastAIMoveDuration,
  isOpen,
  onToggle,
  gameState,
}: AIDiagnosticsPanelProps) {
  if (!lastAIDiagnostics?.diagnostics) {
    return null;
  }

  const piecePositions = calculatePiecePositions(gameState);
  const gamePhase = calculateGamePhase(piecePositions);
  const boardControl = calculateBoardControl(gameState);

  return (
    <motion.div
      className="glass-dark rounded-lg p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <button className="w-full text-left flex justify-between items-center" onClick={onToggle}>
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4 text-green-400" />
          <span className="font-semibold text-sm text-white/90">AI Diagnostics</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-white/70" />
        ) : (
          <ChevronRight className="w-5 h-5 text-white/70" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="glass-light p-2 rounded-md">
                  <p className="text-white/70">Chosen Move</p>
                  <p className="font-bold text-lg text-green-400">
                    Piece #{lastAIDiagnostics.move}
                  </p>
                </div>
                <div className="glass-light p-2 rounded-md">
                  <p className="text-white/70">Evaluation</p>
                  <p
                    className={`font-bold text-lg ${
                      lastAIDiagnostics.evaluation > 0
                        ? 'text-green-400'
                        : lastAIDiagnostics.evaluation < 0
                          ? 'text-red-400'
                          : 'text-white'
                    }`}
                  >
                    {lastAIDiagnostics.evaluation > 0 ? '+' : ''}
                    {lastAIDiagnostics.evaluation.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="glass-light p-2 rounded-md">
                  <p className="text-white/70">AI Time (ms)</p>
                  <p className="font-mono text-white/90">{lastAIMoveDuration?.toFixed(2)}</p>
                </div>
                <div className="glass-light p-2 rounded-md">
                  <p className="text-white/70">Nodes/Hits</p>
                  <p className="font-mono text-white/90">
                    {lastAIDiagnostics.diagnostics.nodesEvaluated} /{' '}
                    {lastAIDiagnostics.diagnostics.transpositionHits}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="glass-light p-2 rounded-md">
                  <p className="text-white/70">Game Phase</p>
                  <p className="font-mono text-white/90">{gamePhase}</p>
                </div>
                <div className="glass-light p-2 rounded-md">
                  <p className="text-white/70">Board Control</p>
                  <p
                    className={`font-mono font-bold ${
                      boardControl > 0
                        ? 'text-green-400'
                        : boardControl < 0
                          ? 'text-red-400'
                          : 'text-white'
                    }`}
                  >
                    {boardControl > 0 ? '+' : ''}
                    {boardControl}
                  </p>
                </div>
              </div>

              {lastAIDiagnostics.thinking && (
                <div className="text-center bg-gray-800/50 p-2 rounded-md">
                  <p className="text-white/70 italic">{lastAIDiagnostics.thinking}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="font-semibold text-white/80">
                  Move Evaluations (Depth: {lastAIDiagnostics.diagnostics.searchDepth})
                </p>
                <div className="max-h-48 overflow-y-auto pr-1">
                  {lastAIDiagnostics.diagnostics.moveEvaluations?.map(
                    (move: MoveEvaluation, index: number) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-2 items-center text-center p-1.5 rounded-md bg-gray-800/50"
                      >
                        <p className="font-mono text-white/90">#{move.pieceIndex}</p>
                        <p className="font-mono text-white/90">
                          {move.fromSquare} → {move.toSquare}
                        </p>
                        <p
                          className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded-full capitalize w-fit mx-auto
                            ${
                              move.moveType === 'capture'
                                ? 'bg-red-500/30 text-red-300'
                                : move.moveType === 'rosette'
                                  ? 'bg-amber-500/30 text-amber-300'
                                  : move.moveType === 'finish'
                                    ? 'bg-green-500/30 text-green-300'
                                    : 'bg-blue-500/30 text-blue-300'
                            }
                          `}
                        >
                          {move.moveType}
                        </p>
                        <p
                          className={`font-mono font-bold ${
                            move.score > 0
                              ? 'text-green-400'
                              : move.score < 0
                                ? 'text-red-400'
                                : 'text-white/80'
                          }`}
                        >
                          {move.score.toFixed(1)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
