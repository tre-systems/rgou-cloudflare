"use client";

import React, { useState } from "react";
import { GameState, Player, ROSETTE_SQUARES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { soundEffects } from "@/lib/sound-effects";
import { Sparkles, Crown, Star, Zap } from "lucide-react";

interface GameBoardProps {
  gameState: GameState;
  onPieceClick: (pieceIndex: number) => void;
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
            ? "0 0 20px rgba(59, 130, 246, 0.8)"
            : "0 0 20px rgba(236, 72, 153, 0.8)",
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

export default function GameBoard({ gameState, onPieceClick }: GameBoardProps) {
  const getPieceIndex = (square: number, player: Player) => {
    const pieces =
      player === "player1" ? gameState.player1Pieces : gameState.player2Pieces;
    return pieces.findIndex((p) => p.square === square);
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
          isCurrentPlayer && "ring-2 ring-white/50"
        )}
        animate={{
          boxShadow: isCurrentPlayer
            ? "0 0 30px rgba(99, 102, 241, 0.3)"
            : "0 0 10px rgba(0, 0, 0, 0.1)",
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

        <div className="grid grid-cols-2 gap-2">
          {/* Starting area */}
          <div className="glass-dark rounded-lg p-2">
            <p className="text-xs text-white/70 text-center mb-1 font-semibold">
              START
            </p>
            <div className="grid grid-cols-4 gap-1">
              {pieces.map((p, i) =>
                p.square === -1 ? (
                  <motion.div
                    key={i}
                    className="w-6 h-6"
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
                    className="w-6 h-6 opacity-20 rounded-full border border-white/20"
                  />
                )
              )}
            </div>
          </div>

          {/* Finish area */}
          <div className="glass-dark rounded-lg p-2">
            <p className="text-xs text-white/70 text-center mb-1 font-semibold">
              FINISH
            </p>
            <div className="grid grid-cols-4 gap-1">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center relative"
                    style={{
                      background:
                        i < finishedPieces.length
                          ? "linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))"
                          : "rgba(255, 255, 255, 0.05)",
                    }}
                    animate={{
                      boxShadow:
                        i < finishedPieces.length
                          ? "0 0 15px rgba(34, 197, 94, 0.5)"
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
    [0, 1, 2, 3, -1, -1, -1, 12],
  ];

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
      </motion.div>

      {/* Player Area */}
      {renderPlayerArea("player1")}
    </div>
  );
}
