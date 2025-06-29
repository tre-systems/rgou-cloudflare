"use client";

import React, { useState, useCallback, useEffect } from "react";
import { GameState } from "@/lib/types";
import { initializeGame, processDiceRoll, makeMove } from "@/lib/game-logic";
import { AIService, AIResponse } from "@/lib/ai-service";
import { wasmAiService } from "@/lib/wasm-ai-service";
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
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSource, setAiSource] = useState<AISource>("server");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Diagnostics state
  const [lastAIDiagnostics, setLastAIDiagnostics] = useState<AIResponse | null>(
    null,
  );
  const [diagnosticsPanelOpen, setDiagnosticsPanelOpen] = useState(false);
  const [lastAIMoveDuration, setLastAIMoveDuration] = useState<number | null>(
    null,
  );

  const [lastMove, setLastMove] = useState<{
    type: "move" | "capture" | "rosette" | "finish";
    player: string;
  } | null>(null);

  const makeAIMove = useCallback(
    async (currentState: GameState) => {
      if (currentState.currentPlayer !== "player2" || !currentState.canMove)
        return;

      setAiThinking(true);
      soundEffects.aiThinking();

      const startTime = performance.now();

      try {
        const aiResponse =
          aiSource === "server"
            ? await AIService.getAIMove(currentState)
            : await wasmAiService.getAIMove(currentState);

        const duration = performance.now() - startTime;
        setLastAIMoveDuration(duration);

        setLastAIDiagnostics(aiResponse);

        setTimeout(() => {
          if (!currentState.validMoves.includes(aiResponse.move)) {
            console.warn(
              `AI returned invalid move ${aiResponse.move}. Valid moves:`,
              currentState.validMoves,
            );
            console.warn("Current game state:", {
              currentPlayer: currentState.currentPlayer,
              diceRoll: currentState.diceRoll,
              canMove: currentState.canMove,
              validMoves: currentState.validMoves,
              aiResponse: aiResponse,
            });

            if (currentState.validMoves.length === 0) {
              console.error(
                "No valid moves available! This should not happen.",
              );
              setAiThinking(false);
              return;
            }

            const fallbackMove = currentState.validMoves[0];
            console.log(`Using fallback move: ${fallbackMove}`);
            const newState = makeMove(currentState, fallbackMove);
            setGameState(newState);
            setAiThinking(false);
            soundEffects.pieceMove();
            return;
          }

          const newState = makeMove(currentState, aiResponse.move);

          if (newState === currentState) {
            console.error("AI move failed to apply! State unchanged.");
            console.error("Move attempted:", aiResponse.move);
            console.error("Current state:", currentState);
            setAiThinking(false);
            return;
          }

          const newPiece = newState.player2Pieces[aiResponse.move];

          if (newPiece.square === 20) {
            soundEffects.pieceMove();
            setLastMove({ type: "finish", player: "player2" });
          } else if (newPiece.square >= 0) {
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

            if ([0, 7, 13, 15, 16].includes(newPiece.square)) {
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

        setLastAIDiagnostics(null);

        setTimeout(() => {
          setGameState((prevState) => makeMove(prevState, fallbackMove));
          setAiThinking(false);
          soundEffects.pieceMove();
        }, 500);
      }
    },
    [aiSource],
  );

  useEffect(() => {
    if (
      gameState.currentPlayer === "player2" &&
      !gameState.canMove &&
      gameState.gameStatus === "playing"
    ) {
      setTimeout(() => setGameState(processDiceRoll), 500);
    }
  }, [
    gameState.currentPlayer,
    gameState.canMove,
    gameState.gameStatus,
    gameState,
  ]);

  useEffect(() => {
    if (gameState.currentPlayer === "player2" && gameState.canMove) {
      makeAIMove(gameState);
    }
  }, [gameState, makeAIMove]);

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

  const handleRollDice = useCallback(async () => {
    if (aiSource === "client") {
      const roll = await wasmAiService.rollDice();
      setGameState((prevState) => processDiceRoll(prevState, roll));
    } else {
      setGameState(processDiceRoll);
    }
  }, [aiSource]);

  const handlePieceClick = useCallback(
    (pieceIndex: number) => {
      if (gameState.canMove && gameState.validMoves.includes(pieceIndex)) {
        const newState = makeMove(gameState, pieceIndex);

        const newPiece = newState.player1Pieces[pieceIndex];

        if (newPiece.square === 20) {
          soundEffects.pieceMove();
          setLastMove({ type: "finish", player: "player1" });
        } else if (newPiece.square >= 0) {
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

          if ([0, 7, 13, 15, 16].includes(newPiece.square)) {
            setTimeout(() => soundEffects.rosetteLanding(), 200);
            setLastMove({ type: "rosette", player: "player1" });
          }
        }

        setGameState(newState);
      }
    },
    [gameState],
  );

  const handleReset = () => {
    setGameState(initializeGame());
    setLastMove(null);
    setLastAIDiagnostics(null);
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

        {/* AI Diagnostics Panel - positioned absolutely to avoid shifting game */}
        {lastAIDiagnostics && (
          <motion.div
            className="hidden xl:block fixed right-4 top-1/2 transform -translate-y-1/2 w-80 space-y-3 z-20"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Diagnostics toggle button */}
            <motion.button
              onClick={() => setDiagnosticsPanelOpen(!diagnosticsPanelOpen)}
              className="w-full glass-dark rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                <Bug className="w-4 h-4 text-amber-400" />
                <span className="text-white/90 text-sm font-medium">
                  AI Diagnostics
                </span>
                <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
                  DEV
                </span>
              </div>
              {diagnosticsPanelOpen ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
            </motion.button>

            {/* Diagnostics content */}
            <AnimatePresence>
              {diagnosticsPanelOpen && (
                <motion.div
                  className="glass-dark rounded-lg p-4 space-y-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    {/* Move & Evaluation Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass rounded-md p-3">
                        <div className="text-xs text-white/60 mb-1">
                          Selected Move
                        </div>
                        <div className="text-lg font-mono text-white">
                          Piece #{lastAIDiagnostics.move}
                        </div>
                      </div>
                      <div className="glass rounded-md p-3">
                        <div className="text-xs text-white/60 mb-1">
                          Evaluation
                        </div>
                        <div
                          className={`text-lg font-mono ${
                            lastAIDiagnostics.evaluation > 0
                              ? "text-pink-400"
                              : lastAIDiagnostics.evaluation < 0
                                ? "text-blue-400"
                                : "text-white/80"
                          }`}
                        >
                          {lastAIDiagnostics.evaluation > 0 ? "+" : ""}
                          {lastAIDiagnostics.evaluation.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Timing and Performance */}
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-2">
                        Performance Metrics
                      </h4>
                      <div className="glass rounded-md p-3 space-y-2">
                        {lastAIMoveDuration && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">
                              Response Time:
                            </span>
                            <span className="text-white/90 font-mono">
                              {lastAIMoveDuration.toFixed(0)}ms
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">AI Source:</span>
                          <span className="text-white/70 font-medium">
                            {aiSource === "server"
                              ? "Server (Minimax)"
                              : "Client (WASM)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    {lastAIDiagnostics.thinking && (
                      <div>
                        <h4 className="text-sm font-medium text-white/80 mb-2">
                          AI Analysis
                        </h4>
                        <div className="glass rounded-md p-3">
                          <div className="text-xs text-white/70 leading-relaxed">
                            {lastAIDiagnostics.thinking}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Position Assessment */}
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-2">
                        Position Assessment
                      </h4>
                      <div className="glass rounded-md p-3">
                        <div className="text-xs text-white/70">
                          {lastAIDiagnostics.evaluation > 1
                            ? "🔴 Strong AI advantage"
                            : lastAIDiagnostics.evaluation > 0.5
                              ? "🟠 Slight AI advantage"
                              : lastAIDiagnostics.evaluation > -0.5
                                ? "🟡 Balanced position"
                                : lastAIDiagnostics.evaluation > -1
                                  ? "🔵 Slight human advantage"
                                  : "🟢 Strong human advantage"}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  );
}
