"use client";

import React from "react";
import { motion } from "framer-motion";
import { Dice6, RotateCcw, Play } from "lucide-react";
import { GameState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GameControlsProps {
  gameState: GameState;
  onRollDice: () => void;
  onResetGame: () => void;
  onStartAIGame: () => void;
  isAIGame: boolean;
  aiThinking?: boolean;
}

export default function GameControls({
  gameState,
  onRollDice,
  onResetGame,
  onStartAIGame,
  isAIGame,
  aiThinking = false,
}: GameControlsProps) {
  const renderDice = () => {
    if (!gameState.diceRoll && gameState.diceRoll !== 0) return null;

    return (
      <motion.div
        className="flex items-center space-x-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <span className="text-sm text-gray-600">Dice roll:</span>
        <div className="flex space-x-1">
          {Array.from({ length: 4 }, (_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-6 h-6 border-2 border-gray-400 bg-white rounded flex items-center justify-center text-xs",
                i < gameState.diceRoll!
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-400"
              )}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 360 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {i < gameState.diceRoll! ? "●" : "○"}
            </motion.div>
          ))}
        </div>
        <span className="text-lg font-bold text-gray-800">
          = {gameState.diceRoll}
        </span>
      </motion.div>
    );
  };

  const getStatusMessage = () => {
    if (gameState.gameStatus === "finished") {
      return `🎉 ${gameState.winner === "player1" ? "Player 1" : "Player 2"} wins!`;
    }
    if (aiThinking && gameState.currentPlayer === "player2") {
      return "🤖 AI is thinking...";
    }
    if (gameState.canMove) {
      return `${gameState.currentPlayer === "player1" ? "Player 1" : "Player 2"}, select a piece to move`;
    }
    if (gameState.diceRoll === 0) {
      return `${gameState.currentPlayer === "player1" ? "Player 1" : "Player 2"} rolled 0 - turn skipped`;
    }
    return `${gameState.currentPlayer === "player1" ? "Player 1" : "Player 2"}'s turn - roll the dice`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      {/* Game Status */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Royal Game of Ur
        </h2>
        <p className="text-lg text-gray-600">{getStatusMessage()}</p>
      </div>

      {/* Dice Display */}
      <div className="flex justify-center">{renderDice()}</div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {!gameState.canMove && gameState.gameStatus === "playing" && (
          <motion.button
            onClick={onRollDice}
            disabled={
              gameState.canMove ||
              (isAIGame && gameState.currentPlayer === "player2")
            }
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors",
              gameState.canMove ||
                (isAIGame && gameState.currentPlayer === "player2")
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            )}
            whileHover={{ scale: gameState.canMove ? 1 : 1.05 }}
            whileTap={{ scale: gameState.canMove ? 1 : 0.95 }}
          >
            <Dice6 className="w-5 h-5" />
            <span>Roll Dice</span>
          </motion.button>
        )}

        <motion.button
          onClick={onResetGame}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset Game</span>
        </motion.button>

        {!isAIGame && (
          <motion.button
            onClick={onStartAIGame}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5" />
            <span>Play vs AI</span>
          </motion.button>
        )}
      </div>

      {/* Game Mode Indicator */}
      <div className="text-center">
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            isAIGame
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          )}
        >
          {isAIGame ? "🤖 Playing vs AI" : "👥 Two Player Mode"}
        </span>
      </div>

      {/* Valid Moves Indicator */}
      {gameState.canMove && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Valid moves: {gameState.validMoves.length}
            {gameState.validMoves.length === 0 && " (Turn will be skipped)"}
          </p>
        </div>
      )}
    </div>
  );
}
