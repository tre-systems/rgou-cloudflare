'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, ROSETTE_SQUARES, PiecePosition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects } from '@/lib/sound-effects';
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
} from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onPieceClick: (pieceIndex: number) => void;
  aiThinking?: boolean;
  onResetGame: () => void;
  aiSource: 'server' | 'client';
  onAiSourceChange: (source: 'server' | 'client') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const CaptureExplosion = ({ position }: { position: { x: number; y: number } }) => {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5 }}
    >
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-8 text-red-400 font-bold text-lg drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -20, -30, -40],
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        CAPTURED!
      </motion.div>

      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-4 border-red-500 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1, 2], opacity: [1, 0.8, 0] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'absolute w-3 h-3 rounded-full',
            i % 3 === 0 ? 'bg-red-500' : i % 3 === 1 ? 'bg-orange-500' : 'bg-yellow-500'
          )}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos(i * (360 / 12) * (Math.PI / 180)) * (30 + Math.random() * 30),
            y: Math.sin(i * (360 / 12) * (Math.PI / 180)) * (30 + Math.random() * 30),
            opacity: [1, 1, 0.5, 0],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
            delay: Math.random() * 0.3,
          }}
        />
      ))}

      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 bg-white rounded-full opacity-90"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className="absolute w-1 h-16 -translate-x-0.5 -translate-y-8 bg-gradient-to-b from-yellow-300 to-red-500"
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: [0, 1, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
    </motion.div>
  );
};

const RosetteLanding = ({ position }: { position: { x: number; y: number } }) => {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
    >
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-10 text-amber-400 font-bold text-lg drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.2, 1, 0],
          y: [0, -15, -20, -30],
        }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      >
        ROSETTE!
      </motion.div>

      <motion.div
        className="absolute -translate-x-1/2 -translate-y-4 text-amber-300 font-semibold text-sm drop-shadow-lg"
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1, 0.9, 0],
          y: [0, -10, -15, -25],
        }}
        transition={{ duration: 2.2, ease: 'easeOut', delay: 0.3 }}
      >
        Extra Turn!
      </motion.div>

      <motion.div
        className="absolute -translate-x-4 -translate-y-4"
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1.5, 1.2, 0],
          rotate: [0, 720],
        }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
      </motion.div>

      <motion.div
        className="absolute w-16 h-16 -translate-x-8 -translate-y-8 border-2 border-amber-400 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1, 1.5],
          opacity: [1, 0.6, 0],
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      <motion.div
        className="absolute w-12 h-12 -translate-x-6 -translate-y-6 border-2 border-yellow-300 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.2, 2],
          opacity: [1, 0.7, 0],
        }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
      />

      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full"
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos(i * (360 / 16) * (Math.PI / 180)) * (25 + Math.random() * 15),
            y: Math.sin(i * (360 / 16) * (Math.PI / 180)) * (25 + Math.random() * 15),
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: 1.8,
            ease: 'easeOut',
            delay: Math.random() * 0.5,
          }}
        />
      ))}

      <motion.div
        className="absolute w-20 h-20 -translate-x-10 -translate-y-10 bg-amber-400 rounded-full opacity-20"
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1, 1.5, 0],
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

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
            ease: 'easeOut',
            delay: 0.3 + i * 0.1,
          }}
        >
          <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
        </motion.div>
      ))}
    </motion.div>
  );
};

const VictoryCelebration = ({
  position,
  player,
}: {
  position: { x: number; y: number };
  player: Player;
}) => {
  const isPlayer = player === 'player1';
  const primaryColor = isPlayer ? 'blue' : 'pink';
  const textColor = isPlayer ? 'text-blue-400' : 'text-pink-400';

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 4 }}
    >
      {/* Main celebration text */}
      <motion.div
        className={cn(
          'absolute -translate-x-1/2 -translate-y-16 font-bold text-2xl drop-shadow-lg whitespace-nowrap',
          textColor
        )}
        initial={{ scale: 0, y: 0 }}
        animate={{
          scale: [0, 1.8, 1.4, 1.2, 0],
          y: [0, -30, -50, -70, -90],
        }}
        transition={{ duration: 3.5, ease: 'easeOut' }}
      >
        {isPlayer ? '🎉 PIECE HOME! 🎉' : '🤖 AI SCORES! 🤖'}
      </motion.div>

      {/* Large trophy icon */}
      <motion.div
        className="absolute -translate-x-8 -translate-y-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: [0, 2, 1.6, 1.4, 0],
          rotate: [0, 360, 720, 1080],
          y: [0, -15, -10, -5, 0],
        }}
        transition={{ duration: 3.5, ease: 'easeOut' }}
      >
        <Trophy className={cn('w-16 h-16', textColor)} />
      </motion.div>

      {/* Particle explosion - more particles */}
      {[...Array(35)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'absolute rounded-full',
            i % 5 === 0
              ? 'w-3 h-3 bg-yellow-400'
              : i % 5 === 1
                ? 'w-2.5 h-2.5 bg-green-400'
                : i % 5 === 2
                  ? `w-3 h-3 bg-${primaryColor}-400`
                  : i % 5 === 3
                    ? 'w-2 h-2 bg-white'
                    : 'w-1.5 h-1.5 bg-amber-300'
          )}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            scale: [0, 1.2, 0.9, 0],
            x: Math.cos(i * (360 / 35) * (Math.PI / 180)) * (60 + Math.random() * 60),
            y: Math.sin(i * (360 / 35) * (Math.PI / 180)) * (60 + Math.random() * 60) - 40,
            opacity: [1, 1, 0.8, 0],
            rotate: [0, 360 + Math.random() * 720],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            ease: 'easeOut',
            delay: Math.random() * 0.5,
          }}
        />
      ))}

      {/* Large expanding ring */}
      <motion.div
        className={cn(
          'absolute w-32 h-32 -translate-x-16 -translate-y-16 border-8 rounded-full',
          `border-${primaryColor}-400`
        )}
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{
          scale: [0, 1.5, 3.5],
          opacity: [1, 0.8, 0],
          rotate: [0, 360],
        }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      />

      {/* Secondary expanding ring */}
      <motion.div
        className="absolute w-24 h-24 -translate-x-12 -translate-y-12 border-4 border-yellow-400 rounded-full"
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{
          scale: [0, 1.2, 2.8],
          opacity: [1, 0.7, 0],
          rotate: [0, -450],
        }}
        transition={{ duration: 2.2, ease: 'easeOut', delay: 0.2 }}
      />

      {/* Halo effect */}
      <motion.div
        className={cn(
          'absolute w-40 h-40 -translate-x-20 -translate-y-20 rounded-full border-2',
          `border-${primaryColor}-300`
        )}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{
          scale: [0, 1, 1.5],
          opacity: [0.8, 0.4, 0],
        }}
        transition={{ duration: 2.8, ease: 'easeOut', delay: 0.1 }}
      />

      {/* Starburst effect */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: Math.cos(i * (360 / 12) * (Math.PI / 180)) * 35,
            top: Math.sin(i * (360 / 12) * (Math.PI / 180)) * 35,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 1.2, 0],
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: 2,
            ease: 'easeOut',
            delay: 0.3 + i * 0.05,
          }}
        >
          <Sparkles className={cn('w-5 h-5', textColor)} />
        </motion.div>
      ))}

      {/* Additional burst particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`burst-${i}`}
          className="absolute"
          style={{
            left: Math.cos(i * (360 / 8) * (Math.PI / 180)) * 20,
            top: Math.sin(i * (360 / 8) * (Math.PI / 180)) * 20,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 2, 1.5, 0],
            opacity: [1, 0.8, 0.5, 0],
          }}
          transition={{
            duration: 1.8,
            ease: 'easeOut',
            delay: 0.1 + i * 0.03,
          }}
        >
          <div className={cn('w-2 h-2 rounded-full bg-yellow-300')} />
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
        'w-full h-full rounded-full border-2 relative overflow-hidden cursor-pointer',
        'bg-gradient-to-br shadow-lg',
        player === 'player1'
          ? 'from-blue-400 via-blue-500 to-blue-600 border-blue-300 piece-glow-player'
          : 'from-pink-400 via-pink-500 to-pink-600 border-pink-300 piece-glow-ai',
        isClickable && 'ring-4 ring-green-400 ring-opacity-60 animate-pulse',
        !isClickable && 'opacity-90',
        isBeingCaptured && 'ring-4 ring-red-500 ring-opacity-80',
        isFinishing && 'ring-4 ring-yellow-400 ring-opacity-80'
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
        type: 'spring',
        stiffness: 400,
        damping: 25,
        y: {
          repeat: isClickable && !isBeingCaptured && !isFinishing ? Infinity : 0,
          duration: 2,
        },
        scale: { duration: isBeingCaptured ? 1.2 : isFinishing ? 1.5 : 0.3 },
        rotate: { duration: isBeingCaptured ? 1.2 : isFinishing ? 1.5 : 0.3 },
      }}
      whileHover={{
        scale: isClickable && !isBeingCaptured && !isFinishing ? 1.1 : 1.02,
        boxShadow:
          player === 'player1'
            ? '0 0 15px rgba(59, 130, 246, 0.5)'
            : '0 0 15px rgba(236, 72, 153, 0.5)',
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
        {player === 'player1' ? (
          <Crown
            className={cn('w-3 h-3 text-white drop-shadow-lg', isFinishing && 'animate-bounce')}
          />
        ) : (
          <Zap
            className={cn('w-3 h-3 text-white drop-shadow-lg', isFinishing && 'animate-bounce')}
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
                  'absolute w-1 h-1 rounded-full',
                  isFinishing ? 'bg-yellow-300' : 'bg-white'
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
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const previousGameState = useRef<GameState | null>(null);
  const [isLocalDevelopment, setIsLocalDevelopment] = useState(false);

  // Only show AI toggle button when running locally
  useEffect(() => {
    setIsLocalDevelopment(
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    );
  }, []);

  // Track game state changes for capture and finish effects
  useEffect(() => {
    if (!previousGameState.current) {
      previousGameState.current = gameState;
      return;
    }

    const prev = previousGameState.current;
    const current = gameState;

    // Check for captures and rosette landings by comparing board states
    current.board.forEach((newPiece, square) => {
      const oldPiece = prev.board[square];

      if (newPiece?.player === oldPiece?.player) return;

      // Capture
      if (newPiece && oldPiece && newPiece.player !== oldPiece.player) {
        const squareElement = boardRef.current?.querySelector(`[data-square-id='${square}']`);
        if (squareElement) {
          const rect = squareElement.getBoundingClientRect();
          setExplosions(prevExplosions => [
            ...prevExplosions,
            {
              id: `explosion-${Date.now()}-${square}`,
              position: {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              },
            },
          ]);
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
          soundEffects.pieceCapture();
        }
      }
      // Rosette Landing
      else if (newPiece && !oldPiece && ROSETTE_SQUARES.includes(square)) {
        const squareElement = boardRef.current?.querySelector(
          `[data-square-id='${newPiece.square}']`
        );
        if (squareElement) {
          const rect = squareElement.getBoundingClientRect();
          setRosetteLandings(prevLandings => [
            ...prevLandings,
            {
              id: `rosette-${Date.now()}-${newPiece.square}`,
              position: {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              },
            },
          ]);
          soundEffects.rosetteLanding();
        }
      }
    });

    // Check for finished pieces
    const checkFinishedPieces = (
      currentPieces: PiecePosition[],
      prevPieces: PiecePosition[],
      player: Player
    ) => {
      const newFinished = currentPieces.filter(p => p.square === 20).length;
      const oldFinished = prevPieces.filter(p => p.square === 20).length;

      if (newFinished > oldFinished && boardRef.current) {
        const finishAreaId = player === 'player1' ? 'player1-finish-area' : 'player2-finish-area';
        const finishArea = document.getElementById(finishAreaId);
        if (finishArea) {
          const rect = finishArea.getBoundingClientRect();
          setCelebrations(prev => [
            ...prev,
            {
              id: `celebration-${Date.now()}-${player}`,
              position: {
                x: rect.left + (newFinished - 0.5) * (rect.width / 7),
                y: rect.top + rect.height / 2,
              },
              player,
            },
          ]);

          // Add screen shake for piece finishing
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 800);
        }
      }
    };

    checkFinishedPieces(current.player1Pieces, prev.player1Pieces, 'player1');
    checkFinishedPieces(current.player2Pieces, prev.player2Pieces, 'player2');

    previousGameState.current = gameState;
  }, [gameState]);

  // Clean up explosion effects
  useEffect(() => {
    explosions.forEach(explosion => {
      setTimeout(() => {
        setExplosions(prev => prev.filter(e => e.id !== explosion.id));
      }, 2000);
    });
  }, [explosions]);

  // Clean up celebration effects
  useEffect(() => {
    celebrations.forEach(celebration => {
      setTimeout(() => {
        setCelebrations(prev => prev.filter(c => c.id !== celebration.id));
      }, 3000);
    });
  }, [celebrations]);

  // Clean up rosette landing effects
  useEffect(() => {
    rosetteLandings.forEach(rosette => {
      setTimeout(() => {
        setRosetteLandings(prev => prev.filter(r => r.id !== rosette.id));
      }, 3000);
    });
  }, [rosetteLandings]);

  const getPieceIndex = (square: number, player: Player) => {
    const pieces = player === 'player1' ? gameState.player1Pieces : gameState.player2Pieces;
    return pieces.findIndex(p => p.square === square);
  };

  const getStatusMessage = () => {
    if (gameState.gameStatus === 'finished') {
      const winner = gameState.winner === 'player1' ? 'You' : 'AI';
      const isPlayerWin = gameState.winner === 'player1';
      return {
        text: `${winner} win${isPlayerWin ? '!' : 's!'}`,
        icon: isPlayerWin ? Trophy : Zap,
        color: isPlayerWin ? 'text-green-400' : 'text-pink-400',
      };
    }
    if (aiThinking) {
      return {
        text: 'AI thinking...',
        icon: Zap,
        color: 'text-pink-400',
      };
    }
    if (gameState.diceRoll && !gameState.canMove) {
      return {
        text: 'No valid moves, turn skipped',
        icon: Dice6,
        color: 'text-gray-400',
      };
    }
    if (gameState.canMove) {
      return {
        text: 'Select a piece to move',
        icon: Crown,
        color: 'text-blue-400',
      };
    }
    if (gameState.diceRoll === 0) {
      return {
        text: 'Rolled 0 - turn skipped',
        icon: Dice6,
        color: 'text-gray-400',
      };
    }

    const isPlayerTurn = gameState.currentPlayer === 'player1';
    return {
      text: `${isPlayerTurn ? 'Your' : "AI's"} turn`,
      icon: isPlayerTurn ? Crown : Zap,
      color: isPlayerTurn ? 'text-blue-400' : 'text-pink-400',
    };
  };

  const renderDice = () => {
    if (gameState.diceRoll === null) return <div className="h-7"></div>;

    return (
      <motion.div
        className="flex items-center justify-center space-x-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <span className="text-xs font-semibold text-white/80">Roll:</span>
        <div className="flex space-x-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full border-2',
                i < gameState.diceRoll!
                  ? 'bg-amber-400 border-amber-300 shadow-lg'
                  : 'bg-white/20 border-white/40'
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: i * 0.1,
                type: 'spring',
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
              '0 0 10px rgba(251, 191, 36, 0.5)',
              '0 0 20px rgba(251, 191, 36, 0.8)',
              '0 0 10px rgba(251, 191, 36, 0.5)',
            ],
          }}
          transition={{ duration: 0.5 }}
        >
          {gameState.diceRoll}
        </motion.span>
      </motion.div>
    );
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
      gameState.currentPlayer === piece.player &&
      piece.player === 'player1'
    );

    const isBeingCaptured = false;
    const isFinishing = piece?.player && squareIndex === 20;

    return (
      <motion.div
        key={key}
        className={cn(
          'aspect-square relative flex items-center justify-center overflow-hidden',
          'board-square rounded-lg',
          isRosette && 'rosette-glow',
          isClickable && 'clickable-square'
        )}
        whileHover={{
          scale: 1.02,
          rotateY: isRosette ? 5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => isClickable && onPieceClick(pieceIndex)}
        data-square-id={squareIndex}
      >
        {isRosette && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Star className="w-6 h-6 text-amber-400 drop-shadow-lg" />
          </motion.div>
        )}
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

        {isClickable && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-green-400 pointer-events-none"
            animate={{
              boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 10px rgba(34, 197, 94, 0)'],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    );
  };

  const renderPlayerArea = (player: Player) => {
    const pieces = player === 'player1' ? gameState.player1Pieces : gameState.player2Pieces;
    const finishedPieces = pieces.filter(p => p.square === 20);
    const isCurrentPlayer = gameState.currentPlayer === player;
    const isAI = player === 'player2';

    const isStartMoveValid =
      isCurrentPlayer &&
      gameState.validMoves.some(moveIndex => pieces[moveIndex] && pieces[moveIndex].square === -1);

    return (
      <motion.div
        className={cn(
          'glass rounded-lg p-3 relative overflow-hidden',
          isCurrentPlayer && 'ring-2 ring-white/30'
        )}
        animate={{
          boxShadow: isCurrentPlayer
            ? '0 0 20px rgba(99, 102, 241, 0.2)'
            : '0 0 8px rgba(0, 0, 0, 0.1)',
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isAI ? (
              <Zap className="w-4 h-4 text-pink-400" />
            ) : (
              <Crown className="w-4 h-4 text-blue-400" />
            )}
            <h3
              className={cn(
                'font-bold text-base neon-text',
                isAI ? 'text-pink-400' : 'text-blue-400',
                isCurrentPlayer && 'animate-pulse'
              )}
            >
              {isAI ? 'AI Player' : 'You'}
            </h3>
          </div>

          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{finishedPieces.length}/7</span>
          </div>
        </div>
        <div className="glass-dark rounded-lg p-2">
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                'rounded-md p-1 transition-all duration-300',
                isStartMoveValid && 'ring-2 ring-green-400 animate-pulse'
              )}
            >
              <p className={cn('text-xs text-white/70 font-semibold mb-1 text-center')}>START</p>
              <div className="flex flex-nowrap gap-0.5 justify-center overflow-x-auto py-1">
                {pieces.map((p, i) =>
                  p.square === -1 ? (
                    <motion.div
                      key={i}
                      className="w-5 h-5"
                      whileHover={{ scale: 1.05 }}
                      onClick={() =>
                        gameState.validMoves.includes(i) && player === 'player1' && onPieceClick(i)
                      }
                    >
                      <MemoizedPiece
                        player={player}
                        isClickable={gameState.validMoves.includes(i) && player === 'player1'}
                        isBeingCaptured={false}
                        isFinishing={false}
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
            <div className="rounded-md p-1">
              <p className="text-xs text-white/70 font-semibold mb-1 text-center">FINISH</p>
              <div
                id={player === 'player1' ? 'player1-finish-area' : 'player2-finish-area'}
                className="flex flex-nowrap gap-0.5 justify-center overflow-x-auto py-1"
              >
                {Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-5 h-5 rounded-full flex items-center justify-center relative"
                      style={{
                        background:
                          i < finishedPieces.length
                            ? 'linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))'
                            : 'rgba(255, 255, 255, 0.05)',
                      }}
                      animate={{
                        boxShadow:
                          i < finishedPieces.length ? '0 0 10px rgba(34, 197, 94, 0.3)' : 'none',
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
        {explosions.map(explosion => (
          <CaptureExplosion key={explosion.id} position={explosion.position} />
        ))}
      </AnimatePresence>

      {/* Victory celebration effects */}
      <AnimatePresence>
        {celebrations.map(celebration => (
          <VictoryCelebration
            key={celebration.id}
            position={celebration.position}
            player={celebration.player}
          />
        ))}
      </AnimatePresence>

      {/* Rosette landing effects */}
      <AnimatePresence>
        {rosetteLandings.map(rosette => (
          <RosetteLanding key={rosette.id} position={rosette.position} />
        ))}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-sm mx-auto space-y-3"
        animate={screenShake ? { x: [0, -2, 2, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* AI Player Area */}
        {renderPlayerArea('player2')}

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
                <StatusIcon className={cn('w-4 h-4', status.color)} />
                <span className={cn('font-bold text-sm', status.color, 'neon-text')}>
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
                          ease: 'easeInOut',
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
              {/* Roll Button / Dice Display Area */}
              <div className="flex items-center h-8">
                <div className="min-w-[70px] h-8 flex items-center">{renderDice()}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* AI Source Toggle - Only show in development */}
                {isLocalDevelopment && (
                  <motion.button
                    onClick={() => onAiSourceChange(aiSource === 'server' ? 'client' : 'server')}
                    className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={`Switch to ${aiSource === 'server' ? 'Client' : 'Server'} AI`}
                  >
                    {aiSource === 'server' ? (
                      <Cloud className="w-3.5 h-3.5" />
                    ) : (
                      <Server className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                )}

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
                    boxShadow: '0 0 10px rgba(107, 114, 128, 0.3)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Player Area */}
        {renderPlayerArea('player1')}
      </motion.div>
    </>
  );
}
