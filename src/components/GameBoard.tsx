import { useState, useEffect, useRef } from 'react';
import type { AISource, GameMode, GameState, MoveType, Player } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import CaptureExplosion from './animations/CaptureExplosion';
import RosetteLanding from './animations/RosetteLanding';
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
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onCreateNearWinningState: () => void;
  watchMode?: boolean;
  aiSourceP1?: AISource | null;
  aiSourceP2?: AISource;
  lastMoveType: MoveType | null;
  lastMovePlayer: Player | null;
}

const BOARD_LAYOUT = [
  16, 17, 18, 19, -1, -1, 15, 14, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, -1, -1, 13, 12,
] as const;

function getElementCenter(element: Element | null) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export default function GameBoard({
  gameState,
  onPieceClick,
  aiThinking = false,
  onResetGame,
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  onCreateNearWinningState,
  watchMode = false,
  aiSourceP1 = null,
  aiSourceP2 = 'ml',
  lastMoveType,
  lastMovePlayer,
}: GameBoardProps) {
  const [explosions, setExplosions] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);
  const [rosetteLandings, setRosetteLandings] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const gameMode: GameMode = watchMode ? 'watch' : 'play';

  useEffect(() => {
    if (!lastMoveType || !lastMovePlayer) return;

    const animationId = `${Date.now()}-${gameState.history.length}`;
    const lastMove = gameState.history.at(-1);

    if (lastMoveType === 'capture' || lastMoveType === 'rosette') {
      if (!lastMove) return;
      const position = getElementCenter(
        boardRef.current?.querySelector(`[data-square-id='${lastMove.toSquare}']`) ?? null
      );
      if (!position) return;

      if (lastMoveType === 'capture') {
        setExplosions(current => [...current, { id: `explosion-${animationId}`, position }]);
      } else {
        setRosetteLandings(current => [...current, { id: `rosette-${animationId}`, position }]);
      }
    }
  }, [lastMoveType, lastMovePlayer, gameState.history]);

  return (
    <>
      <AnimatePresence>
        {explosions.map(explosion => (
          <CaptureExplosion
            key={explosion.id}
            position={explosion.position}
            onComplete={() =>
              setExplosions(current => current.filter(item => item.id !== explosion.id))
            }
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {rosetteLandings.map(rosette => (
          <RosetteLanding
            key={rosette.id}
            position={rosette.position}
            onComplete={() =>
              setRosetteLandings(current => current.filter(item => item.id !== rosette.id))
            }
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {gameState.gameStatus === 'finished' && (
          <GameCompletionOverlay
            gameState={gameState}
            onResetGame={onResetGame}
            gameMode={gameMode}
          />
        )}
      </AnimatePresence>
      <motion.div className="mx-auto w-full max-w-md space-y-3" data-testid="game-board">
        <PlayerArea
          player="player2"
          pieces={gameState.player2Pieces}
          isCurrentPlayer={gameState.currentPlayer === 'player2'}
          isAI={true}
          aiType={aiSourceP2}
          isStartMoveValid={false}
          validMoves={gameState.validMoves}
          onPieceClick={onPieceClick}
        />
        <motion.div
          ref={boardRef}
          className="surface-panel relative rounded-2xl p-3.5 sm:p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="mb-3 text-center">
            <GameStatus
              gameState={gameState}
              aiThinking={aiThinking}
              watchMode={watchMode}
              aiSourceP1={aiSourceP1}
              aiSourceP2={aiSourceP2}
            />
          </div>
          <div className="surface-inset board-grid grid grid-cols-8 gap-1 rounded-xl p-2.5">
            {BOARD_LAYOUT.map((sq, i) => {
              if (sq === -1) return <div key={`empty-${i}`} className="aspect-square" />;

              const piece = gameState.board[sq];
              const playerPieces =
                piece?.player === 'player1' ? gameState.player1Pieces : gameState.player2Pieces;
              const pieceIndex = piece ? playerPieces.findIndex(item => item.square === sq) : -1;
              const isClickable = Boolean(
                piece &&
                gameState.validMoves.includes(pieceIndex) &&
                gameState.currentPlayer === piece.player &&
                piece.player === 'player1'
              );

              return (
                <GameSquare
                  key={`sq-${i}`}
                  squareIndex={sq}
                  piece={piece}
                  pieceIndex={pieceIndex}
                  isClickable={isClickable}
                  onPieceClick={onPieceClick}
                />
              );
            })}
          </div>
          <GameControls
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            onShowHowToPlay={onShowHowToPlay}
            onResetGame={onResetGame}
            onCreateNearWinningState={onCreateNearWinningState}
            diceElement={<GameDice gameState={gameState} />}
          />
        </motion.div>
        <PlayerArea
          player="player1"
          pieces={gameState.player1Pieces}
          isCurrentPlayer={gameState.currentPlayer === 'player1'}
          isAI={watchMode}
          aiType={watchMode ? aiSourceP1 : null}
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
      </motion.div>
    </>
  );
}
