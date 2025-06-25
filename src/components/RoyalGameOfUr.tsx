"use client";

import React, { useState, useCallback, useEffect } from "react";
import { GameState } from "@/lib/types";
import { initializeGame, processDiceRoll, makeMove } from "@/lib/game-logic";
import { AIService } from "@/lib/ai-service";
import { soundEffects } from "@/lib/sound-effects";
import GameBoard from "./GameBoard";
import GameControls from "./GameControls";
import AnimatedBackground from "./AnimatedBackground";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, Zap } from "lucide-react";

export default function RoyalGameOfUr() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{
    type: "move" | "capture" | "rosette" | "finish";
    player: string;
  } | null>(null);

  const makeAIMove = useCallback(async (currentState: GameState) => {
    if (currentState.currentPlayer !== "player2" || !currentState.canMove)
      return;

    setAiThinking(true);
    soundEffects.aiThinking();

    try {
      const aiResponse = await AIService.getAIMove(currentState);
      setTimeout(() => {
        const newState = makeMove(currentState, aiResponse.move);

        // Determine move type for sound effects
        const newPiece = newState.player2Pieces[aiResponse.move];

        if (newPiece.square === 20) {
          soundEffects.pieceMove();
          setLastMove({ type: "finish", player: "player2" });
        } else if (newPiece.square >= 0) {
          // Check if a capture occurred
          const captureOccurred =
            currentState.board[newPiece.square] &&
            currentState.board[newPiece.square]?.player === "player1";

          if (captureOccurred) {
            soundEffects.pieceCapture();
            setLastMove({ type: "capture", player: "player2" });
          } else {
            soundEffects.pieceMove();
            setLastMove({ type: "move", player: "player2" });
          }

          // Check for rosette landing
          if ([4, 8, 14].includes(newPiece.square)) {
            setTimeout(() => soundEffects.rosetteLanding(), 200);
            setLastMove({ type: "rosette", player: "player2" });
          }
        }

        setGameState(newState);
        setAiThinking(false);
      }, 1000);
    } catch (error) {
      console.warn("AI service unavailable, using fallback:", error);
      const fallbackMove = AIService.getFallbackAIMove(currentState);
      setTimeout(() => {
        setGameState((prevState) => makeMove(prevState, fallbackMove));
        setAiThinking(false);
        soundEffects.pieceMove();
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (
      gameState.currentPlayer === "player2" &&
      !gameState.canMove &&
      gameState.gameStatus === "playing"
    ) {
      setTimeout(() => setGameState(processDiceRoll), 500);
    }
  }, [gameState.currentPlayer, gameState.canMove, gameState.gameStatus]);

  useEffect(() => {
    if (gameState.currentPlayer === "player2" && gameState.canMove) {
      makeAIMove(gameState);
    }
  }, [gameState.currentPlayer, gameState.canMove, makeAIMove]);

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

  const handleRollDice = useCallback(() => {
    setGameState(processDiceRoll);
  }, []);

  const handlePieceClick = useCallback(
    (pieceIndex: number) => {
      if (gameState.canMove && gameState.validMoves.includes(pieceIndex)) {
        const newState = makeMove(gameState, pieceIndex);

        // Determine move type for sound effects
        const newPiece = newState.player1Pieces[pieceIndex];

        if (newPiece.square === 20) {
          soundEffects.pieceMove();
          setLastMove({ type: "finish", player: "player1" });
        } else if (newPiece.square >= 0) {
          // Check if a capture occurred
          const captureOccurred =
            gameState.board[newPiece.square] &&
            gameState.board[newPiece.square]?.player === "player2";

          if (captureOccurred) {
            soundEffects.pieceCapture();
            setLastMove({ type: "capture", player: "player1" });
          } else {
            soundEffects.pieceMove();
            setLastMove({ type: "move", player: "player1" });
          }

          // Check for rosette landing
          if ([4, 8, 14].includes(newPiece.square)) {
            setTimeout(() => soundEffects.rosetteLanding(), 200);
            setLastMove({ type: "rosette", player: "player1" });
          }
        }

        setGameState(newState);
      }
    },
    [gameState]
  );

  const handleReset = () => {
    setGameState(initializeGame());
    setLastMove(null);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
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
          />

          {/* Game Board */}
          <GameBoard gameState={gameState} onPieceClick={handlePieceClick} />

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
