"use client";

import React from "react";
import { motion } from "framer-motion";
import { GameState, Player, ROSETTE_SQUARES } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  gameState: GameState;
  onPieceClick: (pieceIndex: number) => void;
}

export default function GameBoard({ gameState, onPieceClick }: GameBoardProps) {
  // Board layout: 3x8 grid where middle row is shared
  const renderSquare = (squareIndex: number, row: number, col: number) => {
    const isRosette = ROSETTE_SQUARES.includes(squareIndex);
    const piece = gameState.board[squareIndex];
    // Check if this square could be a valid move target
    const isValidMoveTarget =
      gameState.canMove && gameState.validMoves.length > 0;

    return (
      <motion.div
        key={`${row}-${col}`}
        className={cn(
          "w-12 h-12 border-2 border-amber-800 bg-amber-100 flex items-center justify-center relative",
          isRosette && "bg-yellow-300 border-yellow-600",
          isValidMoveTarget && gameState.canMove && "ring-2 ring-blue-400"
        )}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {isRosette && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-yellow-800"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        )}

        {piece && (
          <motion.div
            className={cn(
              "w-8 h-8 rounded-full border-2 z-10",
              piece.player === "player1"
                ? "bg-blue-500 border-blue-700"
                : "bg-red-500 border-red-700"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          />
        )}
      </motion.div>
    );
  };

  const renderPlayerArea = (player: Player, isTop: boolean = false) => {
    const pieces =
      player === "player1" ? gameState.player1Pieces : gameState.player2Pieces;
    const startPieces = pieces.filter((p) => p.square === -1);
    const finishedPieces = pieces.filter((p) => p.square === 20);

    return (
      <div
        className={cn(
          "flex flex-col items-center space-y-4",
          isTop && "order-first"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold",
            player === "player1" ? "text-blue-600" : "text-red-600",
            gameState.currentPlayer === player && "text-2xl font-bold"
          )}
        >
          {player === "player1" ? "Player 1 (Blue)" : "Player 2 (Red)"}
        </h3>

        {/* Start area */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Start ({startPieces.length})
          </p>
          <div className="grid grid-cols-4 gap-1">
            {startPieces.map((_, index) => (
              <motion.div
                key={index}
                className={cn(
                  "w-6 h-6 rounded-full border cursor-pointer",
                  player === "player1"
                    ? "bg-blue-400 border-blue-600"
                    : "bg-red-400 border-red-600",
                  gameState.canMove &&
                    gameState.currentPlayer === player &&
                    gameState.validMoves.includes(index) &&
                    "ring-2 ring-green-400"
                )}
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  if (gameState.canMove && gameState.currentPlayer === player) {
                    const pieceIndex = pieces.findIndex(
                      (p, i) => p.square === -1 && i === index
                    );
                    if (
                      pieceIndex >= 0 &&
                      gameState.validMoves.includes(pieceIndex)
                    ) {
                      onPieceClick(pieceIndex);
                    }
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Finish area */}
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Finished ({finishedPieces.length})
          </p>
          <div className="grid grid-cols-4 gap-1">
            {finishedPieces.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-6 h-6 rounded-full border",
                  player === "player1"
                    ? "bg-blue-600 border-blue-800"
                    : "bg-red-600 border-red-800"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-8 p-8">
      {renderPlayerArea("player2", true)}

      {/* Main board */}
      <div className="bg-amber-200 p-6 rounded-lg shadow-lg">
        <div className="grid grid-cols-8 gap-1">
          {/* Top row - Player 2 safe path */}
          {[16, 17, 18, 19].map((squareIndex, col) =>
            renderSquare(squareIndex, 0, col)
          )}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          {/* Middle row - Shared battle path */}
          {[4, 5, 6, 7, 8, 9, 10, 11].map((squareIndex, col) =>
            renderSquare(squareIndex, 1, col)
          )}
          {/* Bottom row - Player 1 safe path */}
          {[0, 1, 2, 3].map((squareIndex, col) =>
            renderSquare(squareIndex, 2, col)
          )}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
        </div>

        {/* Finish paths */}
        <div className="mt-4 grid grid-cols-8 gap-1">
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          <div className="w-12 h-12"></div> {/* Empty space */}
          {[12, 13, 14, 15].map((squareIndex, col) =>
            renderSquare(squareIndex, 3, col + 4)
          )}
        </div>
      </div>

      {renderPlayerArea("player1")}
    </div>
  );
}
