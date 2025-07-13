import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, MoveType, Player, AIResponse } from './schemas';
import {
  initializeGame,
  processDiceRoll as processDiceRollLogic,
  makeMove as makeMoveLogic,
  switchPlayerAfterZeroRoll as switchPlayerAfterZeroRollLogic,
} from './game-logic';
import { AIService } from './ai-service';
import { wasmAiService } from './wasm-ai-service';
import { mlAiService } from './ml-ai-service';
import { useStatsStore } from './stats-store';
import { saveGame } from '@/lib/actions';
import { getPlayerId } from './utils';

type GameStore = {
  gameState: GameState;
  aiThinking: boolean;
  lastAIDiagnostics: AIResponse | null;
  lastAIMoveDuration: number | null;
  lastMoveType: MoveType | null;
  lastMovePlayer: Player | null;
  actions: {
    initialize: (fromStorage?: boolean) => void;
    processDiceRoll: (roll?: number) => void;
    switchPlayerAfterZeroRoll: () => void;
    makeMove: (pieceIndex: number) => void;
    makeAIMove: (aiSource: 'server' | 'client' | 'ml') => Promise<void>;
    reset: () => void;
    postGameToServer: () => Promise<void>;
    createNearWinningState: () => void;
  };
};

const LATEST_VERSION = 1;

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      gameState: initializeGame(),
      aiThinking: false,
      lastAIDiagnostics: null,
      lastAIMoveDuration: null,
      lastMoveType: null,
      lastMovePlayer: null,
      actions: {
        initialize: (fromStorage = false) => {
          if (fromStorage) {
            return;
          }
          set(state => {
            state.gameState = initializeGame();
            state.aiThinking = false;
            state.lastAIDiagnostics = null;
            state.lastAIMoveDuration = null;
            state.lastMoveType = null;
            state.lastMovePlayer = null;
          });
        },
        processDiceRoll: (roll?: number) => {
          set(state => {
            state.gameState = processDiceRollLogic(state.gameState, roll);
          });
        },
        switchPlayerAfterZeroRoll: () => {
          set(state => {
            state.gameState = switchPlayerAfterZeroRollLogic(state.gameState);
          });
        },
        makeMove: (pieceIndex: number) => {
          set(state => {
            if (state.gameState.canMove && state.gameState.validMoves.includes(pieceIndex)) {
              const [newState, moveType, movePlayer] = makeMoveLogic(state.gameState, pieceIndex);
              state.gameState = newState;
              state.lastMoveType = moveType;
              state.lastMovePlayer = movePlayer;

              if (newState.gameStatus === 'finished') {
                if (newState.winner === 'player1') {
                  useStatsStore.getState().actions.incrementWins();
                } else {
                  useStatsStore.getState().actions.incrementLosses();
                }
              }
            }
          });
        },
        makeAIMove: async (aiSource: 'server' | 'client' | 'ml') => {
          const { gameState, actions } = get();
          if (gameState.currentPlayer !== 'player2' || !gameState.canMove) return;

          // If there are no valid moves, immediately switch turn
          if (gameState.validMoves.length === 0) {
            set(state => {
              state.gameState = processDiceRollLogic({
                ...state.gameState,
                currentPlayer: 'player1',
                diceRoll: null,
                canMove: false,
                validMoves: [],
              });
              state.aiThinking = false;
            });
            return;
          }

          set(state => {
            state.aiThinking = true;
          });

          const startTime = performance.now();

          try {
            let aiResponseFromServer;

            if (aiSource === 'ml') {
              const mlResponse = await mlAiService.getAIMove(gameState);
              aiResponseFromServer = {
                move: mlResponse.move,
                evaluation: Math.round(mlResponse.evaluation * 1000),
                thinking: mlResponse.thinking,
                timings: {
                  aiMoveCalculation: mlResponse.timings.ai_move_calculation,
                  totalHandlerTime: mlResponse.timings.total_handler_time,
                },
                diagnostics: {
                  searchDepth: 0,
                  validMoves: mlResponse.diagnostics.valid_moves,
                  moveEvaluations: mlResponse.diagnostics.move_evaluations.map(e => ({
                    pieceIndex: e.piece_index,
                    score: e.score,
                    moveType: e.move_type,
                    fromSquare: e.from_square,
                    toSquare: e.to_square ?? null,
                  })),
                  transpositionHits: 0,
                  nodesEvaluated: 1,
                },
                aiType: 'ml',
              };
            } else {
              aiResponseFromServer =
                aiSource === 'server'
                  ? await AIService.getAIMove(gameState)
                  : await wasmAiService.getAIMove(gameState);
              aiResponseFromServer = { ...aiResponseFromServer, aiType: aiSource };
            }

            const aiResponse = { ...aiResponseFromServer, aiType: aiSource };
            const duration = performance.now() - startTime;

            set(state => {
              state.lastAIMoveDuration = duration;
              state.lastAIDiagnostics = aiResponse;
            });

            const { move: aiMove } = aiResponse;

            if (aiMove === null || aiMove === undefined || !gameState.validMoves.includes(aiMove)) {
              if (gameState.validMoves.length > 0) {
                actions.makeMove(gameState.validMoves[0]);
              }
            } else {
              actions.makeMove(aiMove);
            }
          } catch {
            const fallbackMove = AIService.getFallbackAIMove(gameState);
            actions.makeMove(fallbackMove);
          } finally {
            set(state => {
              state.aiThinking = false;
            });
          }
        },
        reset: () => {
          set(state => {
            state.gameState = initializeGame();
            state.aiThinking = false;
            state.lastAIDiagnostics = null;
            state.lastAIMoveDuration = null;
            state.lastMoveType = null;
            state.lastMovePlayer = null;
          });
        },
        createNearWinningState: () => {
          set(state => {
            // Create a near-winning state for player1
            // Set 6 pieces to finished (square 20)
            for (let i = 0; i < 6; i++) {
              state.gameState.player1Pieces[i].square = 20;
            }
            // Set the 7th piece to square 12 (which is the 12th square in the test)
            state.gameState.player1Pieces[6].square = 12;
            state.gameState.board[12] = state.gameState.player1Pieces[6];

            // Set current player to player1 and ensure it's their turn
            state.gameState.currentPlayer = 'player1';
            state.gameState.gameStatus = 'playing';
            state.gameState.winner = null;
            state.gameState.diceRoll = null;
            state.gameState.canMove = false;
            state.gameState.validMoves = [];

            // Clear any AI state
            state.aiThinking = false;
            state.lastAIDiagnostics = null;
            state.lastAIMoveDuration = null;
            state.lastMoveType = null;
            state.lastMovePlayer = null;
          });
        },
        postGameToServer: async () => {
          const { gameState } = get();
          if (gameState.gameStatus !== 'finished' || !gameState.winner) {
            return;
          }

          const moveCount = gameState.history.length;
          const duration = undefined;

          const version = '1.0.0';
          const clientHeader = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

          try {
            const payload = {
              winner: gameState.winner,
              history: gameState.history,
              clientVersion: '1.0.0',
              playerId: getPlayerId(),
              moveCount,
              duration,
              version,
              clientHeader,
            };

            await saveGame(payload);
          } catch {
            // Error handling
          }
        },
      },
    })),
    {
      name: 'rgou-game-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate game store:', error);
        }
        if (state) {
          state.actions.initialize(true);
        }
      },
      version: LATEST_VERSION,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<GameStore>;
        if (version < LATEST_VERSION || !state || !state.gameState) {
          return { gameState: initializeGame() };
        }
        return { gameState: state.gameState };
      },
      partialize: state => ({
        gameState: state.gameState,
      }),
    }
  )
);

export const useGameStoreActions = () => useGameStore(state => state.actions);

export const useGameState = () => useGameStore(state => state.gameState);
export const useGameActions = () => useGameStore(state => state.actions);
