"use client";

import React from "react";
import { GameState, Player, ROSETTE_SQUARES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  return (
    <motion.div
      className={cn(
        "w-full h-full rounded-full border-2",
        player === "player1"
          ? "bg-blue-500 border-blue-700"
          : "bg-red-500 border-red-700",
        isClickable && "cursor-pointer"
      )}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
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
    const isClickable =
      piece &&
      pieceIndex !== -1 &&
      gameState.validMoves.includes(pieceIndex) &&
      gameState.currentPlayer === piece.player;

    return (
      <div
        key={key}
        className={cn(
          "w-full aspect-square border border-stone-400 bg-stone-200 flex items-center justify-center relative",
          isRosette && "bg-rose-200",
          isClickable && "ring-2 ring-green-500 z-10"
        )}
        onClick={() => isClickable && onPieceClick(pieceIndex)}
      >
        {isRosette && <span className="absolute text-lg text-rose-600">★</span>}
        {piece && (
          <div className="w-4/5 h-4/5 p-0.5">
            <MemoizedPiece player={piece.player} isClickable={isClickable} />
          </div>
        )}
      </div>
    );
  };

  const renderPlayerArea = (player: Player) => {
    const pieces =
      player === "player1" ? gameState.player1Pieces : gameState.player2Pieces;
    const finishedPieces = pieces.filter((p) => p.square === 20);

    return (
      <div className="flex flex-col items-center space-y-2">
        <h3
          className={cn(
            "font-semibold",
            player === "player1" ? "text-blue-600" : "text-red-600",
            gameState.currentPlayer === player && "font-bold underline"
          )}
        >
          {player === "player1" ? "Player 1" : "Player 2"}
        </h3>
        <div className="flex space-x-2">
          <div className="p-2 bg-stone-100 rounded">
            <p className="text-xs text-center mb-1">Start</p>
            <div className="grid grid-cols-4 gap-1">
              {pieces.map((p, i) =>
                p.square === -1 ? (
                  <div
                    key={i}
                    className="w-5 h-5 p-0.5"
                    onClick={() =>
                      gameState.validMoves.includes(i) && onPieceClick(i)
                    }
                  >
                    <MemoizedPiece
                      player={player}
                      isClickable={gameState.validMoves.includes(i)}
                    />
                  </div>
                ) : (
                  <div key={i} className="w-5 h-5"></div>
                )
              )}
            </div>
          </div>
          <div className="p-2 bg-emerald-100 rounded">
            <p className="text-xs text-center mb-1">Done</p>
            <div className="grid grid-cols-4 gap-1">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-emerald-300">
                    {i < finishedPieces.length && (
                      <div className="w-full h-full p-0.5">
                        <MemoizedPiece player={player} isClickable={false} />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const boardLayout = [
    [16, 17, 18, 19, -1, -1, 15, 14],
    [4, 5, 6, 7, 8, 9, 10, 11],
    [0, 1, 2, 3, -1, -1, -1, 12],
  ];

  return (
    <div className="flex flex-col items-center space-y-2">
      {renderPlayerArea("player2")}
      <div className="bg-stone-300 p-2 rounded-lg shadow-inner">
        <div className="grid grid-cols-8 gap-0.5">
          {boardLayout
            .flat()
            .map((sq, i) =>
              sq !== -1 ? (
                renderSquare(sq, `sq-${i}`)
              ) : (
                <div key={`empty-${i}`} className="bg-stone-300" />
              )
            )}
        </div>
      </div>
      {renderPlayerArea("player1")}
    </div>
  );
}
