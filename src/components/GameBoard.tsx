"use client";

import React, { useState, useEffect, useRef } from "react";
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

// Dramatic capture effect component
const CaptureExplosion = ({
  position,
}: {
  position: { x: number; y: number };
}) => {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5 }}
    >
      {/* CAPTURED! Text */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-8 text-red-400 font-bold text-lg drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -20, -30, -40],
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        CAPTURED!
      </motion.div>

      {/* Dramatic explosion ring */}
      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-4 border-red-500 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1, 2], opacity: [1, 0.8, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Fire/explosion particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute w-3 h-3 rounded-full",
            i % 3 === 0
              ? "bg-red-500"
              : i % 3 === 1
                ? "bg-orange-500"
                : "bg-yellow-500",
          )}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x:
              Math.cos(i * (360 / 12) * (Math.PI / 180)) *
              (30 + Math.random() * 30),
            y:
              Math.sin(i * (360 / 12) * (Math.PI / 180)) *
              (30 + Math.random() * 30),
            opacity: [1, 1, 0.5, 0],
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: Math.random() * 0.3,
          }}
        />
      ))}

      {/* Center impact flash */}
      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 bg-white rounded-full opacity-90"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 0.4 }}
      />

      {/* Lightning/crack effect */}
      <motion.div
        className="absolute w-1 h-16 -translate-x-0.5 -translate-y-8 bg-gradient-to-b from-yellow-300 to-red-500"
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: [0, 1, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
    </motion.div>
  );
};

// Mystical rosette landing effect
const RosetteLanding = ({
  position,
}: {
  position: { x: number; y: number };
}) => {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
    >
      {/* ROSETTE! Text */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-10 text-amber-400 font-bold text-lg drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -15, -20, -30],
        }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      >
        ROSETTE!
      </motion.div>

      {/* Extra Turn text */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-4 text-amber-300 font-semibold text-sm drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1, 0.9, 0],
          y: [0, -10, -15, -25],
        }}
        transition={{ duration: 2.2, ease: "easeOut", delay: 0.3 }}
      >
        Extra Turn!
      </motion.div>

      {/* Central spinning star */}
      <motion.div
        className="absolute -translate-x-4 -translate-y-4"
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1.5, 1.2, 0],
          rotate: [0, 720],
        }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
      </motion.div>

      {/* Mystical energy rings */}
      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-2 border-amber-400 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1, 1.5],
          opacity: [1, 0.6, 0],
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 border-2 border-yellow-300 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.2, 2],
          opacity: [1, 0.7, 0],
        }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
      />

      {/* Golden sparkles */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full"
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x:
              Math.cos(i * (360 / 16) * (Math.PI / 180)) *
              (25 + Math.random() * 15),
            y:
              Math.sin(i * (360 / 16) * (Math.PI / 180)) *
              (25 + Math.random() * 15),
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: 1.8,
            ease: "easeOut",
            delay: Math.random() * 0.5,
          }}
        />
      ))}

      {/* Mystical glow pulse */}
      <motion.div
        className="absolute w-20 h-20 -translate-x-10 -translate-y-10 bg-amber-400 rounded-full opacity-20"
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1, 1.5, 0],
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Orbiting mini stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute"
          initial={{
            x: Math.cos(i * (360 / 6) * (Math.PI / 180)) * 20,
            y: Math.sin(i * (360 / 6) * (Math.PI / 180)) * 20,
            scale: 0,
          }}
          animate={{
            x: Math.cos((i * (360 / 6) + 360) * (Math.PI / 180)) * 30,
            y: Math.sin((i * (360 / 6) + 360) * (Math.PI / 180)) * 30,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            delay: 0.3 + i * 0.1,
          }}
        >
          <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
        </motion.div>
      ))}
    </motion.div>
  );
};

// Spectacular victory celebration for finishing pieces
const VictoryCelebration = ({
  position,
  player,
}: {
  position: { x: number; y: number };
  player: Player;
}) => {
  const isPlayer = player === "player1";
  const primaryColor = isPlayer ? "blue" : "pink";
  const textColor = isPlayer ? "text-blue-400" : "text-pink-400";

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3.5 }}
    >
      {/* SAFE! / HOME! Text */}
      <motion.div
        className={cn(
          "absolute -translate-x-1/2 -translate-y-12 font-bold text-xl drop-shadow-lg",
          textColor,
        )}
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.3, 1.1, 0],
          y: [0, -25, -35, -50],
        }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        {isPlayer ? "SAFE!" : "AI SCORES!"}
      </motion.div>

      {/* Victory crown/trophy */}
      <motion.div
        className="absolute -translate-x-6 -translate-y-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: [0, 1.5, 1.2, 0],
          rotate: [0, 360, 720],
          y: [0, -10, 0],
        }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <Trophy className={cn("w-12 h-12", textColor)} />
      </motion.div>

      {/* Confetti burst - multiple layers */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full",
            i % 4 === 0
              ? "w-2 h-2 bg-yellow-400"
              : i % 4 === 1
                ? "w-1.5 h-1.5 bg-green-400"
                : i % 4 === 2
                  ? `w-2 h-2 bg-${primaryColor}-400`
                  : "w-1 h-1 bg-white",
          )}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            scale: [0, 1, 0.8, 0],
            x:
              Math.cos(i * (360 / 20) * (Math.PI / 180)) *
              (40 + Math.random() * 40),
            y:
              Math.sin(i * (360 / 20) * (Math.PI / 180)) *
                (40 + Math.random() * 40) -
              30,
            opacity: [1, 1, 0.7, 0],
            rotate: [0, 180 + Math.random() * 360],
          }}
          transition={{
            duration: 2 + Math.random() * 1,
            ease: "easeOut",
            delay: Math.random() * 0.8,
          }}
        />
      ))}

      {/* Sparkle ring effect */}
      <motion.div
        className={cn(
          "absolute w-20 h-20 -translate-x-10 -translate-y-10 border-4 rounded-full",
          `border-${primaryColor}-400`,
        )}
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{
          scale: [0, 1.2, 2.5],
          opacity: [1, 0.8, 0],
          rotate: [0, 180],
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Secondary sparkle ring */}
      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-2 border-yellow-400 rounded-full"
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{
          scale: [0, 1, 2],
          opacity: [1, 0.6, 0],
          rotate: [0, -270],
        }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
      />

      {/* Radiating stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: Math.cos(i * (360 / 8) * (Math.PI / 180)) * 25,
            top: Math.sin(i * (360 / 8) * (Math.PI / 180)) * 25,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: 0.5 + i * 0.1,
          }}
        >
          <Sparkles className={cn("w-4 h-4", textColor)} />
        </motion.div>
      ))}
    </motion.div>
  );
};

const MemoizedPiece = React.memo(function Piece({
  player,
  isClickable,
  isBeingCaptured,
  isFinishing,
}: {
  player: Player;
  isClickable: boolean;
  isBeingCaptured?: boolean;
  isFinishing?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isClickable) {
      soundEffects.pieceMove();
    }
  };

  // Special animations for capture and finish
  const captureAnimation = isBeingCaptured
    ? {
        scale: [1, 1.3, 0],
        rotate: [0, 180, 360],
        opacity: [1, 0.8, 0],
      }
    : {};

  const finishAnimation = isFinishing
    ? {
        scale: [1, 1.5, 1.2],
        rotate: [0, 360],
        y: [0, -10, 0],
      }
    : {};

  return (
    <motion.div
      className={cn(
        "w-full h-full rounded-full border-2 relative overflow-hidden cursor-pointer",
        "bg-gradient-to-br shadow-lg",
        player === "player1"
          ? "from-blue-400 via-blue-500 to-blue-600 border-blue-300 piece-glow-player"
          : "from-pink-400 via-pink-500 to-pink-600 border-pink-300 piece-glow-ai",
        isClickable && "ring-4 ring-green-400 ring-opacity-60 animate-pulse",
        !isClickable && "opacity-90",
        isBeingCaptured && "ring-4 ring-red-500 ring-opacity-80",
        isFinishing && "ring-4 ring-yellow-400 ring-opacity-80",
      )}
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: isFinishing ? [1, 1.2, 1] : isBeingCaptured ? [1, 1.3, 0] : 1,
        rotate: isFinishing ? [0, 360] : isBeingCaptured ? [0, 720] : 0,
        y: isClickable ? [0, -2, 0] : isFinishing ? [0, -5, 0] : 0,
        ...captureAnimation,
        ...finishAnimation,
      }}
      exit={{
        scale: isBeingCaptured ? 0 : isFinishing ? 1.5 : 0,
        rotate: isBeingCaptured ? 720 : isFinishing ? 360 : 180,
        opacity: isBeingCaptured ? 0 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        y: {
          repeat:
            isClickable && !isBeingCaptured && !isFinishing ? Infinity : 0,
          duration: 2,
        },
        scale: { duration: isBeingCaptured ? 1.2 : isFinishing ? 1.5 : 0.3 },
        rotate: { duration: isBeingCaptured ? 1.2 : isFinishing ? 1.5 : 0.3 },
      }}
      whileHover={{
        scale: isClickable && !isBeingCaptured && !isFinishing ? 1.1 : 1.02,
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

      {/* Capture effect overlay */}
      {isBeingCaptured && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500/40"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: 2 }}
        />
      )}

      {/* Finish effect overlay */}
      {isFinishing && (
        <motion.div
          className="absolute inset-0 rounded-full bg-yellow-400/40"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, repeat: 3 }}
        />
      )}

      {/* Player icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {player === "player1" ? (
          <Crown
            className={cn(
              "w-3 h-3 text-white drop-shadow-lg",
              isFinishing && "animate-bounce",
            )}
          />
        ) : (
          <Zap
            className={cn(
              "w-3 h-3 text-white drop-shadow-lg",
              isFinishing && "animate-bounce",
            )}
          />
        )}
      </div>

      {/* Clickable effect */}
      {isClickable && !isBeingCaptured && !isFinishing && (
        <motion.div
          className="absolute inset-0 rounded-full bg-green-400/20"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* Enhanced hover sparkles */}
      <AnimatePresence>
        {(isHovered || isFinishing) && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(isFinishing ? 6 : 3)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute w-1 h-1 rounded-full",
                  isFinishing ? "bg-yellow-300" : "bg-white",
                )}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${20 + i * 10}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: isFinishing ? 0.5 : 1,
                  repeat: Infinity,
                  delay: i * 0.1,
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
  const [screenShake, setScreenShake] = useState(false);
  const [explosions, setExplosions] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);
  const [celebrations, setCelebrations] = useState<
    Array<{ id: string; position: { x: number; y: number }; player: Player }>
  >([]);
  const [rosetteLandings, setRosetteLandings] = useState<
    Array<{ id: string; position: { x: number; y: number }; player: Player }>
  >([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const previousGameState = useRef<GameState | null>(null);

  // Track game state changes for capture and finish effects
  useEffect(() => {
    if (!previousGameState.current) {
      previousGameState.current = gameState;
      return;
    }

    const prev = previousGameState.current;
    const current = gameState;

    // Check for captures (pieces moved back to start)
    [...prev.player1Pieces, ...prev.player2Pieces].forEach(
      (prevPiece, globalIndex) => {
        const isPlayer1 = globalIndex < 7;
        const currentPieces = isPlayer1
          ? current.player1Pieces
          : current.player2Pieces;
        const pieceIndex = isPlayer1 ? globalIndex : globalIndex - 7;
        const currentPiece = currentPieces[pieceIndex];

        // Detect capture: piece was on board, now at start
        if (
          prevPiece.square > 0 &&
          currentPiece.square === -1 &&
          boardRef.current
        ) {
          const rect = boardRef.current.getBoundingClientRect();
          const randomOffset = () => (Math.random() - 0.5) * 100;

          setExplosions((prev) => [
            ...prev,
            {
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: {
                x: rect.left + rect.width / 2 + randomOffset(),
                y: rect.top + rect.height / 2 + randomOffset(),
              },
            },
          ]);

          // Screen shake effect
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);

          // Play capture sound if enabled
          if (soundEnabled) {
            soundEffects.pieceMove(); // You might want to add a specific capture sound
          }
        }

        // Detect finish: piece moved to square 20
        if (
          prevPiece.square >= 0 &&
          prevPiece.square < 20 &&
          currentPiece.square === 20 &&
          boardRef.current
        ) {
          const rect = boardRef.current.getBoundingClientRect();

          setCelebrations((prev) => [
            ...prev,
            {
              id: `celebration-${Date.now()}-${Math.random()}`,
              position: {
                x: rect.right - 50,
                y: rect.top + (isPlayer1 ? rect.height - 100 : 100),
              },
              player: isPlayer1 ? "player1" : "player2",
            },
          ]);

          // Play celebration sound if enabled
          if (soundEnabled) {
            soundEffects.pieceMove(); // You might want to add a specific victory sound
          }
        }

        // Detect rosette landing: piece moved to a rosette square
        if (
          prevPiece.square >= 0 &&
          currentPiece.square >= 0 &&
          ROSETTE_SQUARES.includes(currentPiece.square) &&
          !ROSETTE_SQUARES.includes(prevPiece.square) &&
          boardRef.current
        ) {
          const rect = boardRef.current.getBoundingClientRect();

          setRosetteLandings((prev) => [
            ...prev,
            {
              id: `rosette-${Date.now()}-${Math.random()}`,
              position: {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              },
              player: isPlayer1 ? "player1" : "player2",
            },
          ]);

          // Play rosette sound if enabled
          if (soundEnabled) {
            soundEffects.pieceMove(); // You might want to add a specific rosette sound
          }
        }
      },
    );

    previousGameState.current = gameState;
  }, [gameState, soundEnabled]);

  // Clean up explosion effects
  useEffect(() => {
    explosions.forEach((explosion) => {
      setTimeout(() => {
        setExplosions((prev) => prev.filter((e) => e.id !== explosion.id));
      }, 2000);
    });
  }, [explosions]);

  // Clean up celebration effects
  useEffect(() => {
    celebrations.forEach((celebration) => {
      setTimeout(() => {
        setCelebrations((prev) => prev.filter((c) => c.id !== celebration.id));
      }, 3000);
    });
  }, [celebrations]);

  // Clean up rosette landing effects
  useEffect(() => {
    rosetteLandings.forEach((rosette) => {
      setTimeout(() => {
        setRosetteLandings((prev) => prev.filter((r) => r.id !== rosette.id));
      }, 3000);
    });
  }, [rosetteLandings]);

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
    if (gameState.diceRoll && !gameState.canMove) {
      return {
        text: "No valid moves, turn skipped",
        icon: Dice6,
        color: "text-gray-400",
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
    if (gameState.diceRoll === null) return <div className="h-7"></div>;

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
                  : "bg-white/20 border-white/40",
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

    // Check if this piece is being captured or finishing (based on recent state changes)
    const isBeingCaptured = false; // Will be enhanced with more sophisticated detection if needed
    const isFinishing = piece?.player && squareIndex === 20;

    return (
      <motion.div
        key={key}
        className={cn(
          "aspect-square relative flex items-center justify-center overflow-hidden",
          "board-square rounded-lg",
          isRosette && "rosette-glow",
          isClickable && "clickable-square",
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
              <MemoizedPiece
                player={piece.player}
                isClickable={isClickable}
                isBeingCaptured={isBeingCaptured}
                isFinishing={isFinishing}
              />
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

    const isStartMoveValid =
      isCurrentPlayer &&
      gameState.validMoves.some(
        (moveIndex) => pieces[moveIndex] && pieces[moveIndex].square === -1,
      );

    return (
      <motion.div
        className={cn(
          "glass rounded-lg p-3 relative overflow-hidden",
          isCurrentPlayer && "ring-2 ring-white/30",
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
                isCurrentPlayer && "animate-pulse",
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
            <div
              className={cn(
                "rounded-md p-1 transition-all duration-300",
                isStartMoveValid && "ring-2 ring-green-400 animate-pulse",
              )}
            >
              <p
                className={cn(
                  "text-xs text-white/70 font-semibold mb-1 text-center",
                )}
              >
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
                        isBeingCaptured={false}
                        isFinishing={false}
                      />
                    </motion.div>
                  ) : (
                    <div
                      key={i}
                      className="w-5 h-5 opacity-20 rounded-full border border-white/20"
                    />
                  ),
                )}
              </div>
            </div>
            <div className="rounded-md p-1">
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
                          <MemoizedPiece
                            player={player}
                            isClickable={false}
                            isBeingCaptured={false}
                            isFinishing={true}
                          />
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
    <>
      {/* Explosion effects */}
      <AnimatePresence>
        {explosions.map((explosion) => (
          <CaptureExplosion key={explosion.id} position={explosion.position} />
        ))}
      </AnimatePresence>

      {/* Victory celebration effects */}
      <AnimatePresence>
        {celebrations.map((celebration) => (
          <VictoryCelebration
            key={celebration.id}
            position={celebration.position}
            player={celebration.player}
          />
        ))}
      </AnimatePresence>

      {/* Rosette landing effects */}
      <AnimatePresence>
        {rosetteLandings.map((rosette) => (
          <RosetteLanding key={rosette.id} position={rosette.position} />
        ))}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-sm mx-auto space-y-3"
        animate={screenShake ? { x: [0, -2, 2, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* AI Player Area */}
        {renderPlayerArea("player2")}

        {/* Game Board */}
        <motion.div
          ref={boardRef}
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
            <div className="mt-2 h-10 flex flex-col justify-start relative pt-1">
              <motion.div
                className="flex items-center justify-center space-x-2 h-6"
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
                    className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1"
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
                ),
              )}
          </div>

          {/* Controls Section */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              {/* Roll Button / Dice Display Area */}
              <div className="flex items-center h-8">
                {!gameState.canMove && gameState.gameStatus === "playing" ? (
                  <motion.button
                    onClick={handleRollDice}
                    disabled={gameState.currentPlayer === "player2"}
                    className={cn(
                      "px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm h-8 min-w-[70px]",
                      "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                      "disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50",
                      "hover:from-blue-600 hover:to-purple-700",
                      "shadow-lg hover:shadow-xl",
                      "flex items-center justify-center",
                    )}
                    whileHover={{
                      scale: gameState.currentPlayer === "player1" ? 1.05 : 1,
                      boxShadow:
                        gameState.currentPlayer === "player1"
                          ? "0 0 15px rgba(99, 102, 241, 0.4)"
                          : "none",
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center space-x-1.5">
                      <motion.div
                        animate={{
                          rotate:
                            gameState.currentPlayer === "player1"
                              ? [0, 360]
                              : 0,
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
                ) : (
                  <div className="min-w-[70px] h-8 flex items-center">
                    {renderDice()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* AI Source Toggle */}
                <motion.button
                  onClick={() =>
                    onAiSourceChange(
                      aiSource === "server" ? "client" : "server",
                    )
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
      </motion.div>
    </>
  );
}
