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
import { OracleAIService } from './oracle-ai-service';
import { useStatsStore } from './stats-store';
import type { AISource, GameState, Player, MoveType, AIResponse, WatchMatchup } from './types';
import { createId } from './utils';
import { useUIStore } from './ui-store';
import { getBrowserStorage, parsePersistedGameState } from './persist-storage';
import { gameCompletedUsage, gameStartedUsage, reportUsage, type GameUsageMode } from './usage';
import { captureException } from './observability';
import type { MLAIResponse, OracleAIResponse } from './ai-protocol';

const LATEST_VERSION = 4;

const wasmAiService = new WasmAiService();
const mlAiService = new MLAIService();
const oracleAiService = new OracleAIService();

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
  usageStartedBy: Player | null;
  usageCompleted: boolean;
  actions: {
    initialize: (fromStorage?: boolean) => void;
    processDiceRoll: (roll?: number) => void;
    endTurn: () => void;
    makeMove: (pieceIndex: number) => void;
    makeAIMove: (aiSource: AISource, isPlayer1AI?: boolean) => Promise<void>;
    reset: () => void;
    reportGameStarted: (mode: GameUsageMode, watchMatchup?: WatchMatchup) => void;
    reportGameCompleted: () => void;
    createNearWinningState: () => void;
  };
};

type GameSession = Omit<GameStore, 'actions'>;

function createGameSession(): GameSession {
  return {
    gameId: createId('game'),
    gameState: { ...initializeGame(), startTime: Date.now() },
    aiThinking: false,
    lastAIDiagnostics: null,
    lastAIMoveDuration: null,
    lastMoveType: null,
    lastMovePlayer: null,
    usageStarted: false,
    usageStartedBy: null,
    usageCompleted: false,
  };
}

function normalizeValueResponse(
  response: MLAIResponse | OracleAIResponse,
  aiType: 'ml' | 'oracle'
): AIResponse {
  return {
    move: response.move,
    evaluation: Math.round(response.evaluation * 1000),
    thinking: response.thinking,
    timings: response.timings,
    diagnostics: {
      searchDepth: aiType === 'ml' ? 4 : 0,
      validMoves: response.diagnostics.valid_moves,
      moveEvaluations: response.diagnostics.move_evaluations.map(evaluation => ({
        pieceIndex: evaluation.piece_index,
        score: evaluation.score,
        moveType: evaluation.move_type,
        fromSquare: evaluation.from_square,
        toSquare: evaluation.to_square ?? null,
      })),
      transpositionHits: 0,
      nodesEvaluated: 1,
    },
    aiType,
  };
}

function fallbackAIResponse(
  move: number,
  duration: number,
  validMoves: number[],
  reason: string
): AIResponse {
  return {
    move,
    evaluation: 0,
    thinking: `Deterministic fallback: ${reason}`,
    timings: { aiMoveCalculation: duration, totalHandlerTime: duration },
    diagnostics: {
      searchDepth: 0,
      validMoves,
      moveEvaluations: [],
      transpositionHits: 0,
      nodesEvaluated: 0,
    },
    aiType: 'fallback',
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      ...createGameSession(),
      actions: {
        initialize: (fromStorage = false) => {
          if (!fromStorage) {
            set(state => {
              Object.assign(state, createGameSession());
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
            let aiResponse: AIResponse;

            if (aiSource === 'ml') {
              aiResponse = normalizeValueResponse(await mlAiService.getAIMove(gameState), 'ml');
            } else if (aiSource === 'oracle') {
              aiResponse = normalizeValueResponse(
                await oracleAiService.getAIMove(gameState),
                'oracle'
              );
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

            if (aiMove === null || !gameState.validMoves.includes(aiMove)) {
              if (gameState.validMoves.length > 0) {
                const fallbackMove = gameState.validMoves[0];
                set(state => {
                  state.lastAIDiagnostics = fallbackAIResponse(
                    fallbackMove,
                    duration,
                    gameState.validMoves,
                    'AI returned an invalid move'
                  );
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
                state.lastAIDiagnostics = fallbackAIResponse(
                  fallbackMove,
                  duration,
                  gameState.validMoves,
                  'AI request failed'
                );
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
            Object.assign(state, createGameSession());
          });
        },
        createNearWinningState: () => {
          set(state => {
            Object.assign(state, createGameSession());
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
          });
        },
        reportGameStarted: (mode, watchMatchup) => {
          const { gameState, usageStarted } = get();
          if (usageStarted) return;
          set(state => {
            state.usageStarted = true;
            state.usageStartedBy = gameState.currentPlayer;
          });
          reportUsage(gameStartedUsage(mode, gameState.currentPlayer, watchMatchup));
        },
        reportGameCompleted: () => {
          const { gameState, usageCompleted, usageStartedBy } = get();
          const { selectedMode: mode, watchMatchup } = useUIStore.getState();
          if (usageCompleted || gameState.gameStatus !== 'finished' || !mode) return;
          set(state => {
            state.usageCompleted = true;
          });
          reportUsage(
            gameCompletedUsage(mode, gameState, usageStartedBy ?? undefined, watchMatchup)
          );
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
          usageStartedBy:
            persisted.usageStartedBy === 'player1' || persisted.usageStartedBy === 'player2'
              ? persisted.usageStartedBy
              : null,
          usageCompleted: persisted.usageCompleted === true,
        };
      },
      partialize: state => ({
        gameId: state.gameId,
        gameState: toPersistedGameState(state.gameState),
        usageStarted: state.usageStarted,
        usageStartedBy: state.usageStartedBy,
        usageCompleted: state.usageCompleted,
      }),
    }
  )
);

export const useGameState = () => useGameStore(state => state.gameState);
export const useGameActions = () => useGameStore(state => state.actions);
