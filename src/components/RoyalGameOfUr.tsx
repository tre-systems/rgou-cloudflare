"use client";

import React, { useState, useCallback, useEffect } from "react";
import { GameState } from "@/lib/types";
import { initializeGame, processDiceRoll, makeMove } from "@/lib/game-logic";
import { AIService } from "@/lib/ai-service";
import GameBoard from "./GameBoard";
import GameControls from "./GameControls";

export default function RoyalGameOfUr() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [isAIGame, setIsAIGame] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const makeAIMove = useCallback(async (currentState: GameState) => {
    if (currentState.currentPlayer !== "player2" || !currentState.canMove)
      return;
    setAiThinking(true);
    try {
      const aiResponse = await AIService.getAIMove(currentState);
      setTimeout(() => {
        setGameState((prevState) => makeMove(prevState, aiResponse.move));
        setAiThinking(false);
      }, 1000);
    } catch (error) {
      console.warn("AI service unavailable, using fallback:", error);
      const fallbackMove = AIService.getFallbackAIMove(currentState);
      setTimeout(() => {
        setGameState((prevState) => makeMove(prevState, fallbackMove));
        setAiThinking(false);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (
      isAIGame &&
      gameState.currentPlayer === "player2" &&
      !gameState.canMove &&
      gameState.gameStatus === "playing"
    ) {
      setTimeout(() => setGameState(processDiceRoll), 500);
    }
  }, [
    isAIGame,
    gameState.currentPlayer,
    gameState.canMove,
    gameState.gameStatus,
  ]);

  useEffect(() => {
    if (
      isAIGame &&
      gameState.currentPlayer === "player2" &&
      gameState.canMove
    ) {
      makeAIMove(gameState);
    }
  }, [
    isAIGame,
    gameState.currentPlayer,
    gameState.canMove,
    makeAIMove,
    gameState,
  ]);

  const handleRollDice = useCallback(() => setGameState(processDiceRoll), []);
  const handlePieceClick = useCallback(
    (pieceIndex: number) => {
      if (gameState.canMove && gameState.validMoves.includes(pieceIndex)) {
        setGameState((prevState) => makeMove(prevState, pieceIndex));
      }
    },
    [gameState.canMove, gameState.validMoves]
  );

  const handleReset = (aiGame: boolean) => {
    setIsAIGame(aiGame);
    setGameState(initializeGame());
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-2">
      <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg p-4 space-y-4">
        <h1 className="text-center text-2xl font-bold text-stone-800">
          Royal Game of Ur
        </h1>

        <GameControls
          gameState={gameState}
          onRollDice={handleRollDice}
          onResetGame={() => handleReset(isAIGame)}
          isAIGame={isAIGame}
          aiThinking={aiThinking}
        />

        <GameBoard gameState={gameState} onPieceClick={handlePieceClick} />

        <div className="flex justify-around">
          <button
            onClick={() => handleReset(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isAIGame
                ? "bg-blue-600 text-white"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            Two Player
          </button>
          <button
            onClick={() => handleReset(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              isAIGame
                ? "bg-emerald-600 text-white"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            Play vs AI
          </button>
        </div>
      </div>
    </div>
  );
}
