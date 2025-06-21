"use client";

import React, { useState, useCallback, useEffect } from "react";
import { GameState, GameAction } from "@/lib/types";
import { initializeGame, processDiceRoll, makeMove } from "@/lib/game-logic";
import { AIService } from "@/lib/ai-service";
import GameBoard from "./GameBoard";
import GameControls from "./GameControls";

export default function RoyalGameOfUr() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [isAIGame, setIsAIGame] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Enhanced AI move logic using the Cloudflare Worker
  const makeAIMove = useCallback(async (currentState: GameState) => {
    if (currentState.currentPlayer !== "player2" || !currentState.canMove)
      return;

    setAiThinking(true);

    try {
      // Try to get move from AI service
      const aiResponse = await AIService.getAIMove(currentState);

      // Delay to make AI moves visible and show thinking process
      setTimeout(() => {
        setGameState((prevState) => makeMove(prevState, aiResponse.move));
        setAiThinking(false);
      }, 1500);
    } catch (error) {
      console.warn("AI service unavailable, using fallback:", error);

      // Fallback to simple AI if service is unavailable
      const fallbackMove = AIService.getFallbackAIMove(currentState);

      setTimeout(() => {
        setGameState((prevState) => makeMove(prevState, fallbackMove));
        setAiThinking(false);
      }, 1000);
    }
  }, []);

  // Auto-roll dice for AI
  useEffect(() => {
    if (
      isAIGame &&
      gameState.currentPlayer === "player2" &&
      !gameState.canMove &&
      gameState.gameStatus === "playing"
    ) {
      setTimeout(() => {
        setGameState((prevState) => processDiceRoll(prevState));
      }, 1000);
    }
  }, [
    isAIGame,
    gameState.currentPlayer,
    gameState.canMove,
    gameState.gameStatus,
  ]);

  // Make AI move when it's AI's turn and can move
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

  const handleRollDice = useCallback(() => {
    setGameState((prevState) => processDiceRoll(prevState));
  }, []);

  const handlePieceClick = useCallback(
    (pieceIndex: number) => {
      if (gameState.canMove && gameState.validMoves.includes(pieceIndex)) {
        setGameState((prevState) => makeMove(prevState, pieceIndex));
      }
    },
    [gameState.canMove, gameState.validMoves]
  );

  const handleResetGame = useCallback(() => {
    setGameState(initializeGame());
  }, []);

  const handleStartAIGame = useCallback(() => {
    setIsAIGame(true);
    setGameState(initializeGame());
  }, []);

  const handleStartTwoPlayerGame = useCallback(() => {
    setIsAIGame(false);
    setGameState(initializeGame());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Game Info */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-amber-900 mb-4">
              🏺 Royal Game of Ur 🏺
            </h1>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Experience the ancient Mesopotamian board game dating back 4,500
              years. Race your pieces around the board and be the first to get
              all 7 pieces home!
            </p>
          </div>

          {/* Game Controls */}
          <div className="flex justify-center">
            <GameControls
              gameState={gameState}
              onRollDice={handleRollDice}
              onResetGame={handleResetGame}
              onStartAIGame={handleStartAIGame}
              isAIGame={isAIGame}
              aiThinking={aiThinking}
            />
          </div>

          {/* Game Board */}
          <GameBoard gameState={gameState} onPieceClick={handlePieceClick} />

          {/* Game Mode Toggle */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleStartTwoPlayerGame}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                !isAIGame
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              👥 Two Player Mode
            </button>
            <button
              onClick={handleStartAIGame}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isAIGame
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🤖 Play vs AI
            </button>
          </div>

          {/* Game Rules */}
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              How to Play
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  🎯 Objective
                </h4>
                <p>
                  Be the first to move all 7 of your pieces around the board and
                  off the finish.
                </p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">
                  🎲 Dice
                </h4>
                <p>
                  Roll 4 binary dice. The number of marked sides determines your
                  move distance (0-4).
                </p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">
                  ⭐ Rosettes
                </h4>
                <p>
                  Special starred squares are safe zones and grant an extra turn
                  when landed on.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🛡️ Combat</h4>
                <p>
                  Land on an opponent's piece to send it back to start (except
                  on rosettes).
                </p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">
                  🏁 Winning
                </h4>
                <p>
                  Move all pieces through your path and off the board to win!
                </p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">
                  📍 Path
                </h4>
                <p>
                  Each player has their own safe path at the start and end, with
                  a shared battle zone in the middle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
