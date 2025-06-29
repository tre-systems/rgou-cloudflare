"use client";

import React, { useState } from "react";
import { GameState, Player, ROSETTE_SQUARES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { soundEffects } from "@/lib/sound-effects";
import {
  Sparkles,
  Crown,
  Star,
  Zap,
  Dice6,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Cloud,
  Server,
} from "lucide-react";

interface GameBoardProps {
  gameState: GameState;
  onPieceClick: (pieceIndex: number) => void;
  aiThinking?: boolean;
  onRollDice: () => void;
  onResetGame: () => void;
  aiSource: "server" | "client";
  onAiSourceChange: (source: "server" | "client") => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const MemoizedPiece = React.memo(function Piece({
  player,
  isClickable,
}: {
  player: Player;
  isClickable: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isClickable) {
      soundEffects.pieceMove();
    }
  };

  return (
    <motion.div
      className={cn(
        "w-full h-full rounded-full border-2 relative overflow-hidden cursor-pointer",
        "bg-gradient-to-br shadow-lg",
        player === "player1"
          ? "from-blue-400 via-blue-500 to-blue-600 border-blue-300 piece-glow-player"
          : "from-pink-400 via-pink-500 to-pink-600 border-pink-300 piece-glow-ai",
        isClickable && "ring-4 ring-green-400 ring-opacity-60 animate-pulse",
        !isClickable && "opacity-90"
      )}
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: 1,
        rotate: 0,
        y: isClickable ? [0, -2, 0] : 0,
      }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        y: { repeat: isClickable ? Infinity : 0, duration: 2 },
      }}
      whileHover={{
        scale: isClickable ? 1.1 : 1.02,
        boxShadow:
          player === "player1"
            ? "0 0 15px rgba(59, 130, 246, 0.5)"
            : "0 0 15px rgba(236, 72, 153, 0.5)",
      }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Inner glow */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

      {/* Player icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {player === "player1" ? (
          <Crown className="w-3 h-3 text-white drop-shadow-lg" />
        ) : (
          <Zap className="w-3 h-3 text-white drop-shadow-lg" />
        )}
      </div>

      {/* Clickable effect */}
      {isClickable && (
        <motion.div
          className="absolute inset-0 rounded-full bg-green-400/20"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* Hover sparkles */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${20 + i * 15}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function GameBoard({
  gameState,
  onPieceClick,
  aiThinking = false,
  onRollDice,
  onResetGame,
  aiSource,
  onAiSourceChange,
  soundEnabled,
  onToggleSound,
}: GameBoardProps) {
  const getPieceIndex = (square: number, player: Player) => {
    const pieces =
      player === "player1" ? gameState.player1Pieces : gameState.player2Pieces;
    return pieces.findIndex((p) => p.square === square);
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

  const handleRollDice = () => {
    soundEffects.diceRoll();
    onRollDice();
  };

  const handleResetGame = () => {
    soundEffects.buttonClick();
    onResetGame();
  };

  const toggleSound = () => {
    soundEffects.buttonClick();
    onToggleSound();
  };

  const renderSquare = (squareIndex: number, key: string) => {
    const isRosette = ROSETTE_SQUARES.includes(squareIndex);
    const piece = gameState.board[squareIndex];

    const pieceIndex = piece ? getPieceIndex(squareIndex, piece.player) : -1;
    const isClickable = !!(
      piece &&
      pieceIndex !== -1 &&
      gameState.validMoves.includes(pieceIndex) &&
      gameState.currentPlayer === piece.player
    );

    return (
      <motion.div
        key={key}
        className={cn(
          "aspect-square relative flex items-center justify-center overflow-hidden",
          "board-square rounded-lg",
          isRosette && "rosette-glow",
          isClickable && "clickable-square"
        )}
        whileHover={{
          scale: 1.02,
          rotateY: isRosette ? 5 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={() => isClickable && onPieceClick(pieceIndex)}
      >
        {/* Rosette decoration */}
        {isRosette && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-6 h-6 text-amber-400 drop-shadow-lg" />
          </motion.div>
        )}

        {/* Square number for debugging (remove in production) */}
        <div className="absolute top-0 left-0 text-xs text-white/30 p-1">
          {squareIndex}
        </div>

        {/* Piece */}
        <AnimatePresence mode="wait">
          {piece && (
            <motion.div
              key={`${piece.player}-${pieceIndex}`}
              className="w-3/5 h-3/5 p-0.5"
              layoutId={`piece-${piece.player}-${pieceIndex}`}
            >
              <MemoizedPiece player={piece.player} isClickable={isClickable} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clickable indicator */}
        {isClickable && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-green-400 pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0.7)",
                "0 0 0 10px rgba(34, 197, 94, 0)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    );
  };

  const renderPlayerArea = (player: Player) => {
    const pieces =
      player === "player1" ? gameState.player1Pieces : gameState.player2Pieces;
    const finishedPieces = pieces.filter((p) => p.square === 20);
    const isCurrentPlayer = gameState.currentPlayer === player;
    const isAI = player === "player2";

    return (
      <motion.div
        className={cn(
          "glass rounded-lg p-3 relative overflow-hidden",
          isCurrentPlayer && "ring-2 ring-white/30"
        )}
        animate={{
          boxShadow: isCurrentPlayer
            ? "0 0 20px rgba(99, 102, 241, 0.2)"
            : "0 0 8px rgba(0, 0, 0, 0.1)",
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Player header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isAI ? (
              <Zap className="w-4 h-4 text-pink-400" />
            ) : (
              <Crown className="w-4 h-4 text-blue-400" />
            )}
            <h3
              className={cn(
                "font-bold text-base neon-text",
                isAI ? "text-pink-400" : "text-blue-400",
                isCurrentPlayer && "animate-pulse"
              )}
            >
              {isAI ? "AI Player" : "You"}
            </h3>
          </div>

          {/* Score display */}
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">
              {finishedPieces.length}/7
            </span>
          </div>
        </div>

        {/* Compact single line layout */}
        <div className="glass-dark rounded-lg p-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-white/70 font-semibold mb-1 text-center">
                START
              </p>
              <div className="flex gap-0.5 flex-wrap justify-center">
                {pieces.map((p, i) =>
                  p.square === -1 ? (
                    <motion.div
                      key={i}
                      className="w-5 h-5"
                      whileHover={{ scale: 1.05 }}
                      onClick={() =>
                        gameState.validMoves.includes(i) && onPieceClick(i)
                      }
                    >
                      <MemoizedPiece
                        player={player}
                        isClickable={gameState.validMoves.includes(i)}
                      />
                    </motion.div>
                  ) : (
                    <div
                      key={i}
                      className="w-5 h-5 opacity-20 rounded-full border border-white/20"
                    />
                  )
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/70 font-semibold mb-1 text-center">
                FINISH
              </p>
              <div className="flex gap-0.5 flex-wrap justify-center">
                {Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-5 h-5 rounded-full flex items-center justify-center relative"
                      style={{
                        background:
                          i < finishedPieces.length
                            ? "linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))"
                            : "rgba(255, 255, 255, 0.05)",
                      }}
                      animate={{
                        boxShadow:
                          i < finishedPieces.length
                            ? "0 0 10px rgba(34, 197, 94, 0.3)"
                            : "none",
                      }}
                    >
                      {i < finishedPieces.length && (
                        <motion.div
                          className="w-full h-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <MemoizedPiece player={player} isClickable={false} />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current player indicator */}
        {isCurrentPlayer && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </motion.div>
    );
  };

  const boardLayout = [
    [16, 17, 18, 19, -1, -1, 15, 14],
    [4, 5, 6, 7, 8, 9, 10, 11],
    [0, 1, 2, 3, -1, -1, 13, 12],
  ];

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      {/* AI Player Area */}
      {renderPlayerArea("player2")}

      {/* Game Board */}
      <motion.div
        className="glass mystical-glow rounded-xl p-4 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Board title */}
        <div className="text-center mb-3">
          <motion.h3
            className="text-base font-bold text-white/90 neon-text"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            Ancient Board of Ur
          </motion.h3>

          {/* Status Section */}
          <div className="mt-2 h-8 flex flex-col justify-center">
            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ scale: aiThinking ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: aiThinking ? Infinity : 0, duration: 1 }}
            >
              <StatusIcon className={cn("w-4 h-4", status.color)} />
              <span
                className={cn("font-bold text-sm", status.color, "neon-text")}
              >
                {status.text}
              </span>
            </motion.div>

            {/* AI thinking animation */}
            <AnimatePresence>
              {aiThinking && (
                <motion.div
                  className="flex justify-center space-x-1 mt-1"
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
        </div>

        {/* The game board grid */}
        <div className="grid grid-cols-8 gap-1 bg-black/20 p-2 rounded-lg backdrop-blur">
          {boardLayout
            .flat()
            .map((sq, i) =>
              sq !== -1 ? (
                renderSquare(sq, `sq-${i}`)
              ) : (
                <div key={`empty-${i}`} className="aspect-square" />
              )
            )}
        </div>

        {/* Controls Section */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            {/* Dice Display */}
            <div className="flex-1">{renderDice()}</div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* AI Source Toggle */}
              <motion.button
                onClick={() =>
                  onAiSourceChange(aiSource === "server" ? "client" : "server")
                }
                className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`Switch to ${
                  aiSource === "server" ? "Client" : "Server"
                } AI`}
              >
                {aiSource === "server" ? (
                  <Cloud className="w-3.5 h-3.5" />
                ) : (
                  <Server className="w-3.5 h-3.5" />
                )}
              </motion.button>

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
                        ? "0 0 15px rgba(99, 102, 241, 0.4)"
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
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
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
                  boxShadow: "0 0 10px rgba(107, 114, 128, 0.3)",
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
        </div>
      </motion.div>

      {/* Player Area */}
      {renderPlayerArea("player1")}
    </div>
  );
}
