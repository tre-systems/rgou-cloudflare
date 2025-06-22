"use client";

import React from "react";
import { motion } from "framer-motion";
import { Dice6, RotateCcw } from "lucide-react";
import { GameState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GameControlsProps {
  gameState: GameState;
  onRollDice: () => void;
  onResetGame: () => void;
  isAIGame: boolean;
  aiThinking?: boolean;
}

export default function GameControls({
  gameState,
  onRollDice,
  onResetGame,
  isAIGame,
  aiThinking = false,
}: GameControlsProps) {
  const renderDice = () => {
    if (gameState.diceRoll === null) return <div className="h-6"></div>;
    return (
      <div className="flex items-center justify-center space-x-1">
        <span className="text-sm">Roll:</span>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border",
              i < gameState.diceRoll! ? "bg-stone-800" : "bg-white"
            )}
          />
        ))}
        <span className="text-sm font-bold w-4">{gameState.diceRoll}</span>
      </div>
    );
  };

  const getStatusMessage = () => {
    if (gameState.gameStatus === "finished")
      return `🏆 ${gameState.winner === "player1" ? "P1" : "P2"} wins!`;
    if (aiThinking) return "🤖 AI thinking...";
    if (gameState.canMove) return "Select a piece";
    if (gameState.diceRoll === 0) return `Rolled 0, turn skipped.`;
    return `${gameState.currentPlayer === "player1" ? "P1" : "P2"}'s turn`;
  };

  return (
    <div className="bg-stone-100 p-2 rounded-lg space-y-2">
      <div className="text-center font-semibold text-stone-700 h-6 flex items-center justify-center">
        {getStatusMessage()}
      </div>

      <div className="flex items-center justify-between">
        {renderDice()}
        <div className="flex items-center space-x-2">
          {!gameState.canMove && gameState.gameStatus === "playing" && (
            <motion.button
              onClick={onRollDice}
              disabled={isAIGame && gameState.currentPlayer === "player2"}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md disabled:bg-stone-300"
              whileTap={{ scale: 0.95 }}
            >
              <Dice6 className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            onClick={onResetGame}
            className="px-3 py-1 text-sm bg-stone-500 text-white rounded-md"
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
