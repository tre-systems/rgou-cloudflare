"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGameStore, useGameState, useGameActions } from "@/lib/game-store";
import { soundEffects } from "@/lib/sound-effects";
import GameBoard from "./GameBoard";
import GameControls, { AISource } from "./GameControls";
import AnimatedBackground from "./AnimatedBackground";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Crown,
  Zap,
  Bug,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export default function RoyalGameOfUr() {
  const gameState = useGameState();
  const { processDiceRoll, makeMove, makeAIMove, reset } = useGameActions();
  const aiThinking = useGameStore((state) => state.aiThinking);
  const lastAIDiagnostics = useGameStore((state) => state.lastAIDiagnostics);
  const lastAIMoveDuration = useGameStore((state) => state.lastAIMoveDuration);
  const lastMoveType = useGameStore((state) => state.lastMoveType);
  const lastMovePlayer = useGameStore((state) => state.lastMovePlayer);

  const [aiSource, setAiSource] = useState<AISource>("server");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Diagnostics state
  const [diagnosticsPanelOpen, setDiagnosticsPanelOpen] = useState(false);

  const [lastMove, setLastMove] = useState<{
    type: "move" | "capture" | "rosette" | "finish";
    player: string;
  } | null>(null);

  useEffect(() => {
    if (
      gameState.currentPlayer === "player2" &&
      !gameState.canMove &&
      gameState.gameStatus === "playing"
    ) {
      setTimeout(() => processDiceRoll(), 500);
    }
  }, [
    gameState.currentPlayer,
    gameState.canMove,
    gameState.gameStatus,
    processDiceRoll,
  ]);

  useEffect(() => {
    if (gameState.currentPlayer === "player2" && gameState.canMove) {
      soundEffects.aiThinking();
      makeAIMove(aiSource);
    }
  }, [gameState, makeAIMove, aiSource]);

  // Handle game end sound effects
  useEffect(() => {
    if (gameState.gameStatus === "finished") {
      setTimeout(() => {
        if (gameState.winner === "player1") {
          soundEffects.gameWin();
        } else {
          soundEffects.gameLoss();
        }
      }, 500);
    }
  }, [gameState.gameStatus, gameState.winner]);

  useEffect(() => {
    if (lastMoveType && lastMovePlayer) {
      setLastMove({
        type: lastMoveType,
        player: lastMovePlayer,
      });

      switch (lastMoveType) {
        case "capture":
          soundEffects.pieceCapture();
          break;
        case "rosette":
          soundEffects.rosetteLanding();
          break;
        case "finish":
        case "move":
          soundEffects.pieceMove();
          break;
      }
    }
  }, [lastMoveType, lastMovePlayer]);

  useEffect(() => {
    if (
      gameState.currentPlayer === "player1" &&
      !gameState.canMove &&
      gameState.diceRoll === null &&
      gameState.gameStatus === "playing"
    ) {
      setTimeout(() => processDiceRoll(), 500);
    }
  }, [
    gameState.currentPlayer,
    gameState.canMove,
    gameState.diceRoll,
    gameState.gameStatus,
    processDiceRoll,
  ]);

  const handleRollDice = useCallback(async () => {
    processDiceRoll();
  }, [processDiceRoll]);

  const handlePieceClick = useCallback(
    (pieceIndex: number) => {
      if (gameState.canMove && gameState.validMoves.includes(pieceIndex)) {
        makeMove(pieceIndex);
      }
    },
    [gameState.canMove, gameState.validMoves, makeMove]
  );

  const handleReset = () => {
    reset();
    setLastMove(null);
  };

  const toggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        {/* Game area - stays centered */}
        <motion.div
          className="w-full max-w-sm mx-auto space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <motion.div
            className="text-center space-y-1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 neon-text"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              Royal Game of Ur
            </motion.h1>

            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-white/80 font-medium text-sm">
                Ancient Mesopotamian Board Game
              </span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </motion.div>
          </motion.div>

          {/* Game Controls */}
          <GameControls
            gameState={gameState}
            onRollDice={handleRollDice}
            onResetGame={handleReset}
            aiThinking={aiThinking}
            aiSource={aiSource}
            onAiSourceChange={setAiSource}
          />

          {/* Game Board */}
          <GameBoard
            gameState={gameState}
            onPieceClick={handlePieceClick}
            aiThinking={aiThinking}
            onRollDice={handleRollDice}
            onResetGame={handleReset}
            aiSource={aiSource}
            onAiSourceChange={setAiSource}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />

          {/* AI Diagnostics Panel */}
          {lastAIDiagnostics && (
            <motion.div
              className="glass-dark rounded-lg p-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                className="w-full text-left flex justify-between items-center"
                onClick={() => setDiagnosticsPanelOpen(!diagnosticsPanelOpen)}
              >
                <div className="flex items-center space-x-2">
                  <Bug className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-sm text-white/90">
                    AI Diagnostics
                  </span>
                </div>
                {diagnosticsPanelOpen ? (
                  <ChevronDown className="w-5 h-5 text-white/70" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white/70" />
                )}
              </button>

              <AnimatePresence>
                {diagnosticsPanelOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-3 text-xs">
                      {/* Top-level info */}
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
                                ? "text-green-400"
                                : lastAIDiagnostics.evaluation < 0
                                  ? "text-red-400"
                                  : "text-white"
                            }`}
                          >
                            {lastAIDiagnostics.evaluation > 0 ? "+" : ""}
                            {lastAIDiagnostics.evaluation.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Timings and performance */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="glass-light p-2 rounded-md">
                          <p className="text-white/70">AI Time (ms)</p>
                          <p className="font-mono text-white/90">
                            {lastAIMoveDuration?.toFixed(2)}
                          </p>
                        </div>
                        <div className="glass-light p-2 rounded-md">
                          <p className="text-white/70">Nodes/Hits</p>
                          <p className="font-mono text-white/90">
                            {lastAIDiagnostics.diagnostics.nodesEvaluated} /{" "}
                            {lastAIDiagnostics.diagnostics.transpositionHits}
                          </p>
                        </div>
                      </div>

                      {/* Thinking process */}
                      {lastAIDiagnostics.thinking && (
                        <div className="text-center bg-gray-800/50 p-2 rounded-md">
                          <p className="text-white/70 italic">
                            {lastAIDiagnostics.thinking}
                          </p>
                        </div>
                      )}

                      {/* Move evaluations table */}
                      <div className="space-y-1">
                        <p className="font-semibold text-white/80">
                          Move Evaluations (Depth:{" "}
                          {lastAIDiagnostics.diagnostics.searchDepth})
                        </p>
                        <div className="max-h-48 overflow-y-auto pr-1">
                          {lastAIDiagnostics.diagnostics.moveEvaluations.map(
                            (move, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-4 gap-2 items-center text-center p-1.5 rounded-md bg-gray-800/50"
                              >
                                <p className="font-mono text-white/90">
                                  #{move.pieceIndex}
                                </p>
                                <p className="font-mono text-white/90">
                                  {move.fromSquare} → {move.toSquare}
                                </p>
                                <p
                                  className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded-full capitalize w-fit mx-auto
                                    ${
                                      move.moveType === "capture"
                                        ? "bg-red-500/30 text-red-300"
                                        : move.moveType === "rosette"
                                          ? "bg-amber-500/30 text-amber-300"
                                          : move.moveType === "finish"
                                            ? "bg-green-500/30 text-green-300"
                                            : "bg-blue-500/30 text-blue-300"
                                    }
                                  `}
                                >
                                  {move.moveType}
                                </p>
                                <p
                                  className={`font-mono font-bold ${
                                    move.score > 0
                                      ? "text-green-400"
                                      : move.score < 0
                                        ? "text-red-400"
                                        : "text-white/80"
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
          )}

          {/* Move Notifications */}
          <AnimatePresence>
            {lastMove && (
              <motion.div
                className="fixed top-4 right-4 z-50"
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div
                  className={`
                  glass-dark rounded-lg p-3 max-w-xs
                  ${
                    lastMove.player === "player1"
                      ? "border-l-4 border-blue-400"
                      : "border-l-4 border-pink-400"
                  }
                `}
                >
                  <div className="flex items-center space-x-2">
                    {lastMove.player === "player1" ? (
                      <Crown className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-pink-400" />
                    )}
                    <span className="text-white/90 text-sm font-medium">
                      {lastMove.type === "capture" && "Piece captured!"}
                      {lastMove.type === "rosette" && "Landed on rosette!"}
                      {lastMove.type === "finish" && "Piece finished!"}
                      {lastMove.type === "move" && "Piece moved"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <p className="text-white/50 text-xs">
              Challenge the AI in this 4,500-year-old strategy game
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
