"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice6,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  Crown,
} from "lucide-react";
import { GameState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/lib/sound-effects";

interface GameControlsProps {
  gameState: GameState;
  onRollDice: () => void;
  onResetGame: () => void;
  aiThinking?: boolean;
}

export default function GameControls({
  gameState,
  onRollDice,
  onResetGame,
  aiThinking = false,
}: GameControlsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleRollDice = () => {
    soundEffects.diceRoll();
    onRollDice();
  };

  const handleResetGame = () => {
    soundEffects.buttonClick();
    onResetGame();
  };

  const toggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);
    soundEffects.buttonClick();
  };

  const renderDice = () => {
    if (gameState.diceRoll === null) return <div className="h-6"></div>;

    return (
      <motion.div
        className="flex items-center justify-center space-x-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <span className="text-xs font-semibold text-white/80">Roll:</span>
        <div className="flex space-x-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full border-2",
                i < gameState.diceRoll!
                  ? "bg-amber-400 border-amber-300 shadow-lg"
                  : "bg-white/20 border-white/40"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: i * 0.1,
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>
        <motion.span
          className="text-lg font-bold text-amber-400 neon-text min-w-[20px] text-center"
          animate={{
            scale: [1, 1.2, 1],
            textShadow: [
              "0 0 10px rgba(251, 191, 36, 0.5)",
              "0 0 20px rgba(251, 191, 36, 0.8)",
              "0 0 10px rgba(251, 191, 36, 0.5)",
            ],
          }}
          transition={{ duration: 0.5 }}
        >
          {gameState.diceRoll}
        </motion.span>
      </motion.div>
    );
  };

  const getStatusMessage = () => {
    if (gameState.gameStatus === "finished") {
      const winner = gameState.winner === "player1" ? "You" : "AI";
      const isPlayerWin = gameState.winner === "player1";
      return {
        text: `${winner} win${isPlayerWin ? "!" : "s!"}`,
        icon: isPlayerWin ? Trophy : Zap,
        color: isPlayerWin ? "text-green-400" : "text-pink-400",
      };
    }
    if (aiThinking) {
      return {
        text: "AI thinking...",
        icon: Zap,
        color: "text-pink-400",
      };
    }
    if (gameState.canMove) {
      return {
        text: "Select a piece to move",
        icon: Crown,
        color: "text-blue-400",
      };
    }
    if (gameState.diceRoll === 0) {
      return {
        text: "Rolled 0 - turn skipped",
        icon: Dice6,
        color: "text-gray-400",
      };
    }

    const isPlayerTurn = gameState.currentPlayer === "player1";
    return {
      text: `${isPlayerTurn ? "Your" : "AI's"} turn`,
      icon: isPlayerTurn ? Crown : Zap,
      color: isPlayerTurn ? "text-blue-400" : "text-pink-400",
    };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <motion.div
      className="glass rounded-lg p-3 space-y-3 relative overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Status Section */}
      <div className="text-center">
        <motion.div
          className="flex items-center justify-center space-x-2 mb-1"
          animate={{ scale: aiThinking ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: aiThinking ? Infinity : 0, duration: 1 }}
        >
          <StatusIcon className={cn("w-4 h-4", status.color)} />
          <span
            className={cn("font-bold text-base", status.color, "neon-text")}
          >
            {status.text}
          </span>
        </motion.div>

        {/* AI thinking animation */}
        <AnimatePresence>
          {aiThinking && (
            <motion.div
              className="flex justify-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-pink-400 rounded-full"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dice and Controls Section */}
      <div className="flex items-center justify-between">
        {/* Dice Display */}
        <div className="flex-1">{renderDice()}</div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Sound Toggle */}
          <motion.button
            onClick={toggleSound}
            className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </motion.button>

          {/* Roll Dice Button */}
          {!gameState.canMove && gameState.gameStatus === "playing" && (
            <motion.button
              onClick={handleRollDice}
              disabled={gameState.currentPlayer === "player2"}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm",
                "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                "disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50",
                "hover:from-blue-600 hover:to-purple-700",
                "shadow-lg hover:shadow-xl"
              )}
              whileHover={{
                scale: gameState.currentPlayer === "player1" ? 1.05 : 1,
                boxShadow:
                  gameState.currentPlayer === "player1"
                    ? "0 0 20px rgba(99, 102, 241, 0.5)"
                    : "none",
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-1.5">
                <motion.div
                  animate={{
                    rotate:
                      gameState.currentPlayer === "player1" ? [0, 360] : 0,
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Dice6 className="w-3.5 h-3.5" />
                </motion.div>
                <span>Roll</span>
              </div>
            </motion.button>
          )}

          {/* Reset Button */}
          <motion.button
            onClick={handleResetGame}
            className="p-1.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(107, 114, 128, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Game finished celebration */}
      <AnimatePresence>
        {gameState.gameStatus === "finished" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                {gameState.winner === "player1" ? (
                  <Trophy className="w-16 h-16 text-green-400 mx-auto mb-2" />
                ) : (
                  <Zap className="w-16 h-16 text-pink-400 mx-auto mb-2" />
                )}
              </motion.div>
              <h2
                className={cn(
                  "text-2xl font-bold neon-text",
                  gameState.winner === "player1"
                    ? "text-green-400"
                    : "text-pink-400"
                )}
              >
                {gameState.winner === "player1" ? "Victory!" : "AI Wins!"}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
