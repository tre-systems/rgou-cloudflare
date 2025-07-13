'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects } from '@/lib/sound-effects';
import { useGameStore } from '@/lib/game-store';
import CaptureExplosion from './animations/CaptureExplosion';
import RosetteLanding from './animations/RosetteLanding';
import VictoryCelebration from './animations/VictoryCelebration';
import GameSquare from './game/GameSquare';
import PlayerArea from './game/PlayerArea';
import GameCompletionOverlay from './game/GameCompletionOverlay';
import GameControls from './game/GameControls';
import GameStatus from './game/GameStatus';
import GameDice from './game/GameDice';

interface GameBoardProps {
  gameState: GameState;
  onPieceClick: (pieceIndex: number) => void;
  aiThinking?: boolean;
  onResetGame: () => void;
  aiSource: 'server' | 'client';
  onAiSourceChange: (source: 'server' | 'client') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onCreateNearWinningState: () => void;
}

export default function GameBoard({
  gameState,
  onPieceClick,
  aiThinking = false,
  onResetGame,
  aiSource,
  onAiSourceChange,
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  onCreateNearWinningState,
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
  const { actions } = useGameStore();

  // Ensure DB post happens after state is truly finished
  React.useEffect(() => {
    if (gameState.gameStatus === 'finished' && gameState.winner) {
      actions.postGameToServer();
    }
  }, [gameState.gameStatus, gameState.winner, actions]);

  // Track game state changes for capture and finish effects
  useEffect(() => {
    if (!previousGameState.current) {
      previousGameState.current = gameState;
      return;
    }

    const prev = previousGameState.current;
    const current = gameState;

    // Check for captures by comparing board states
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
    });
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

  const boardLayout = [
    [16, 17, 18, 19, -1, -1, 15, 14],
    [4, 5, 6, 7, 8, 9, 10, 11],
    [0, 1, 2, 3, -1, -1, 13, 12],
  ];

  return (
    <>
      <AnimatePresence>
        {explosions.map(explosion => (
          <CaptureExplosion key={explosion.id} position={explosion.position} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {celebrations.map(celebration => (
          <VictoryCelebration
            key={celebration.id}
            position={celebration.position}
            player={celebration.player}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {rosetteLandings.map(rosette => (
          <RosetteLanding key={rosette.id} position={rosette.position} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {gameState.gameStatus === 'finished' && (
          <GameCompletionOverlay gameState={gameState} onResetGame={onResetGame} />
        )}
      </AnimatePresence>
      <motion.div
        className="w-full max-w-sm mx-auto space-y-3"
        animate={screenShake ? { x: [0, -2, 2, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {PlayerArea && (
          <PlayerArea
            player="player2"
            pieces={gameState.player2Pieces}
            isCurrentPlayer={gameState.currentPlayer === 'player2'}
            isAI={true}
            isStartMoveValid={false}
            validMoves={gameState.validMoves}
            onPieceClick={onPieceClick}
          />
        )}
        <motion.div
          ref={boardRef}
          className="glass mystical-glow rounded-xl p-4 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-3">
            <GameStatus gameState={gameState} aiThinking={aiThinking} />
          </div>
          <div className="grid grid-cols-8 gap-1 bg-black/20 p-2 rounded-lg backdrop-blur">
            {boardLayout
              .flat()
              .map((sq, i) =>
                sq !== -1 ? (
                  <GameSquare
                    key={`sq-${i}`}
                    squareIndex={sq}
                    piece={gameState.board[sq]}
                    pieceIndex={
                      gameState.board[sq]
                        ? gameState.board[sq].player === 'player1'
                          ? gameState.player1Pieces.findIndex(p => p.square === sq)
                          : gameState.player2Pieces.findIndex(p => p.square === sq)
                        : 0
                    }
                    isClickable={
                      !!(
                        gameState.board[sq] &&
                        gameState.validMoves.includes(
                          gameState.board[sq].player === 'player1'
                            ? gameState.player1Pieces.findIndex(p => p.square === sq)
                            : gameState.player2Pieces.findIndex(p => p.square === sq)
                        ) &&
                        gameState.currentPlayer === gameState.board[sq].player &&
                        gameState.board[sq].player === 'player1'
                      )
                    }
                    isFinishing={!!(gameState.board[sq]?.player && sq === 20)}
                    onPieceClick={onPieceClick}
                  />
                ) : (
                  <div key={`empty-${i}`} className="aspect-square" />
                )
              )}
          </div>
          <GameControls
            aiSource={aiSource}
            onAiSourceChange={onAiSourceChange}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            onShowHowToPlay={onShowHowToPlay}
            onResetGame={onResetGame}
            onCreateNearWinningState={onCreateNearWinningState}
            diceElement={<GameDice gameState={gameState} />}
          />
        </motion.div>
        {PlayerArea && (
          <PlayerArea
            player="player1"
            pieces={gameState.player1Pieces}
            isCurrentPlayer={gameState.currentPlayer === 'player1'}
            isAI={false}
            isStartMoveValid={
              gameState.currentPlayer === 'player1' &&
              gameState.validMoves.some(
                moveIndex =>
                  gameState.player1Pieces[moveIndex] &&
                  gameState.player1Pieces[moveIndex].square === -1
              )
            }
            validMoves={gameState.validMoves}
            onPieceClick={onPieceClick}
          />
        )}
      </motion.div>
    </>
  );
}
