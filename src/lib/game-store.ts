import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  endTurn as endTurnLogic,
  initializeGame,
  getValidMoves,
  processDiceRoll,
  makeMove as makeMoveLogic,
  toPersistedGameState,
} from './game-logic';
import { WasmAiService } from './wasm-ai-service';
import { MLAIService } from './ml-ai-service';
import { useStatsStore } from './stats-store';
import type { AISource, GameState, Player, MoveType, AIResponse } from './types';
import { createId } from './utils';
import { useUIStore } from './ui-store';
import { getBrowserStorage, parsePersistedGameState } from './persist-storage';
import { gameCompletedUsage, gameStartedUsage, reportUsage, type GameUsageMode } from './usage';
import { captureException } from './observability';

const LATEST_VERSION = 4;

const wasmAiService = new WasmAiService();
const mlAiService = new MLAIService();

function restoreGameId(value: unknown): string {
  return typeof value === 'string' && /^game_[A-Za-z0-9_-]+$/.test(value) && value.length <= 128
    ? value
    : createId('game');
}

type GameStore = {
  gameId: string;
  gameState: GameState;
  aiThinking: boolean;
  lastAIDiagnostics: AIResponse | null;
  lastAIMoveDuration: number | null;
  lastMoveType: MoveType | null;
  lastMovePlayer: Player | null;
  usageStarted: boolean;
  usageCompleted: boolean;
  actions: {
    initialize: (fromStorage?: boolean) => void;
    processDiceRoll: (roll?: number) => void;
    endTurn: () => void;
    makeMove: (pieceIndex: number) => void;
    makeAIMove: (aiSource: AISource, isPlayer1AI?: boolean) => Promise<void>;
    reset: () => void;
    reportGameStarted: (mode: GameUsageMode) => void;
    reportGameCompleted: () => void;
    createNearWinningState: () => void;
  };
};

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      gameId: createId('game'),
      gameState: { ...initializeGame(), startTime: Date.now() },
      aiThinking: false,
      lastAIDiagnostics: null,
      lastAIMoveDuration: null,
      lastMoveType: null,
      lastMovePlayer: null,
      usageStarted: false,
      usageCompleted: false,
      actions: {
        initialize: (fromStorage = false) => {
          if (!fromStorage) {
            set(state => {
              state.gameId = createId('game');
              state.gameState = { ...initializeGame(), startTime: Date.now() };
              state.aiThinking = false;
              state.lastAIDiagnostics = null;
              state.lastAIMoveDuration = null;
              state.lastMoveType = null;
              state.lastMovePlayer = null;
              state.usageStarted = false;
              state.usageCompleted = false;
            });
          }
        },
        processDiceRoll: roll => {
          const { gameState } = get();
          if (gameState.gameStatus !== 'playing' || gameState.diceRoll !== null) {
            return;
          }

          const newState = processDiceRoll(gameState, roll);
          set(state => {
            state.gameState = newState;
          });
        },
        endTurn: () => {
          set(state => {
            state.gameState = endTurnLogic(state.gameState);
          });
        },
        makeMove: (pieceIndex: number) => {
          const { gameState } = get();
          const validMoves = getValidMoves(gameState);
          if (gameState.diceRoll && validMoves.includes(pieceIndex)) {
            const [newState, moveType, movePlayer] = makeMoveLogic(gameState, pieceIndex);
            set(state => {
              state.gameState = newState;
              state.lastMoveType = moveType;
              state.lastMovePlayer = movePlayer;

              if (
                newState.gameStatus === 'finished' &&
                useUIStore.getState().selectedMode !== 'watch'
              ) {
                if (newState.winner === 'player1') {
                  useStatsStore.getState().actions.incrementWins();
                } else {
                  useStatsStore.getState().actions.incrementLosses();
                }
              }
            });
          }
        },
        makeAIMove: async (aiSource: AISource, isPlayer1AI = false) => {
          const { aiThinking, gameId, gameState, actions } = get();

          if (aiThinking || !gameState.canMove) return;

          if (!isPlayer1AI && gameState.currentPlayer !== 'player2') {
            return;
          }

          set(state => {
            state.aiThinking = true;
          });

          const startTime = performance.now();
          const isCurrentTurn = () => {
            const current = get();
            return (
              current.gameId === gameId &&
              current.gameState.currentPlayer === gameState.currentPlayer &&
              current.gameState.diceRoll === gameState.diceRoll &&
              current.gameState.history.length === gameState.history.length
            );
          };

          try {
            let aiResponse;

            if (aiSource === 'ml') {
              const mlResponse = await mlAiService.getAIMove(gameState);
              aiResponse = {
                move: mlResponse.move,
                evaluation: Math.round(mlResponse.evaluation * 1000),
                thinking: mlResponse.thinking,
                timings: {
                  aiMoveCalculation: mlResponse.timings?.aiMoveCalculation || 0,
                  totalHandlerTime: mlResponse.timings?.totalHandlerTime || 0,
                },
                diagnostics: {
                  searchDepth: 4,
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
                aiType: 'ml' as const,
              };
            } else if (aiSource === 'heuristic') {
              const heuristicResponse = await wasmAiService.getHeuristicAIMove(gameState);
              aiResponse = { ...heuristicResponse, aiType: 'heuristic' as const };
            } else {
              const wasmResponse = await wasmAiService.getAIMove(gameState);
              aiResponse = { ...wasmResponse, aiType: 'classic' as const };
            }

            const duration = performance.now() - startTime;

            if (!isCurrentTurn()) {
              return;
            }

            set(state => {
              state.lastAIMoveDuration = duration;
              state.lastAIDiagnostics = aiResponse;
            });

            const { move: aiMove } = aiResponse;

            if (aiMove === null || aiMove === undefined || !gameState.validMoves.includes(aiMove)) {
              if (gameState.validMoves.length > 0) {
                const fallbackMove = gameState.validMoves[0];
                set(state => {
                  state.lastAIDiagnostics = {
                    move: fallbackMove,
                    evaluation: 0,
                    thinking: 'Deterministic fallback: AI returned an invalid move',
                    timings: { aiMoveCalculation: duration, totalHandlerTime: duration },
                    diagnostics: {
                      searchDepth: 0,
                      validMoves: gameState.validMoves,
                      moveEvaluations: [],
                      transpositionHits: 0,
                      nodesEvaluated: 0,
                    },
                    aiType: 'fallback',
                  };
                });
                actions.makeMove(fallbackMove);
              }
            } else {
              actions.makeMove(aiMove);
            }
          } catch (error) {
            console.error('GameStore: AI move failed:', error);
            captureException(error, {
              operation: 'ai-move',
              aiSource,
              currentPlayer: gameState.currentPlayer,
            });
            if (isCurrentTurn() && gameState.validMoves.length > 0) {
              const fallbackMove = gameState.validMoves[0];
              const duration = performance.now() - startTime;
              console.warn('GameStore: Using deterministic fallback move:', fallbackMove);
              set(state => {
                state.lastAIMoveDuration = duration;
                state.lastAIDiagnostics = {
                  move: fallbackMove,
                  evaluation: 0,
                  thinking: 'Deterministic fallback: AI request failed',
                  timings: { aiMoveCalculation: duration, totalHandlerTime: duration },
                  diagnostics: {
                    searchDepth: 0,
                    validMoves: gameState.validMoves,
                    moveEvaluations: [],
                    transpositionHits: 0,
                    nodesEvaluated: 0,
                  },
                  aiType: 'fallback',
                };
              });
              actions.makeMove(fallbackMove);
            }
          } finally {
            set(state => {
              if (state.gameId === gameId) {
                state.aiThinking = false;
              }
            });
          }
        },
        reset: () => {
          set(state => {
            state.gameId = createId('game');
            state.gameState = { ...initializeGame(), startTime: Date.now() };
            state.aiThinking = false;
            state.lastAIDiagnostics = null;
            state.lastAIMoveDuration = null;
            state.lastMoveType = null;
            state.lastMovePlayer = null;
            state.usageStarted = false;
            state.usageCompleted = false;
          });
        },
        createNearWinningState: () => {
          set(state => {
            state.gameId = createId('game');
            state.gameState = { ...initializeGame(), startTime: Date.now() };
            for (let i = 0; i < 6; i++) {
              state.gameState.player1Pieces[i].square = 20;
            }
            state.gameState.player1Pieces[6].square = 12;
            state.gameState.board[12] = state.gameState.player1Pieces[6];

            state.gameState.currentPlayer = 'player1';
            state.gameState.gameStatus = 'playing';
            state.gameState.winner = null;
            state.gameState.diceRoll = null;
            state.gameState.canMove = false;
            state.gameState.validMoves = [];

            state.aiThinking = false;
            state.lastAIDiagnostics = null;
            state.lastAIMoveDuration = null;
            state.lastMoveType = null;
            state.lastMovePlayer = null;
            state.usageStarted = false;
            state.usageCompleted = false;
          });
        },
        reportGameStarted: mode => {
          const { gameState, usageStarted } = get();
          if (usageStarted) return;
          set(state => {
            state.usageStarted = true;
          });
          reportUsage(gameStartedUsage(mode, gameState.currentPlayer));
        },
        reportGameCompleted: () => {
          const { gameState, usageCompleted } = get();
          const mode = useUIStore.getState().selectedMode;
          if (usageCompleted || gameState.gameStatus !== 'finished' || !mode) return;
          set(state => {
            state.usageCompleted = true;
          });
          reportUsage(gameCompletedUsage(mode, gameState));
        },
      },
    })),
    {
      name: 'rgou-game-storage',
      storage: createJSONStorage(getBrowserStorage),
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
        const gameState = parsePersistedGameState(state?.gameState);

        if (!gameState) {
          return {
            gameId: createId('game'),
            gameState: { ...initializeGame(), startTime: Date.now() },
          };
        }

        return {
          gameId:
            version >= LATEST_VERSION && typeof state.gameId === 'string'
              ? restoreGameId(state.gameId)
              : createId('game'),
          gameState,
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameStore>;
        const gameState = parsePersistedGameState(persisted?.gameState);

        if (!gameState) {
          return currentState;
        }

        return {
          ...currentState,
          gameId: restoreGameId(persisted.gameId),
          gameState,
          usageStarted: persisted.usageStarted === true,
          usageCompleted: persisted.usageCompleted === true,
        };
      },
      partialize: state => ({
        gameId: state.gameId,
        gameState: toPersistedGameState(state.gameState),
        usageStarted: state.usageStarted,
        usageCompleted: state.usageCompleted,
      }),
    }
  )
);

export const useGameState = () => useGameStore(state => state.gameState);
export const useGameActions = () => useGameStore(state => state.actions);
