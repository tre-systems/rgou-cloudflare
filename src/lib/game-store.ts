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
import type { AISource, GameState, Player, MoveType, WatchMatchup } from './types';
import { createId } from './utils';
import { useUIStore } from './ui-store';
import { getBrowserStorage, parsePersistedGameState } from './persist-storage';
import { gameCompletedUsage, gameStartedUsage, reportUsage, type GameUsageMode } from './usage';
import { captureException } from './observability';

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
    lastMoveType: null,
    lastMovePlayer: null,
    usageStarted: false,
    usageStartedBy: null,
    usageCompleted: false,
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
            let aiMove: number | null;

            if (aiSource === 'ml') {
              aiMove = (await mlAiService.getAIMove(gameState)).move;
            } else if (aiSource === 'oracle') {
              aiMove = (await oracleAiService.getAIMove(gameState)).move;
            } else if (aiSource === 'heuristic') {
              aiMove = (await wasmAiService.getHeuristicAIMove(gameState)).move;
            } else {
              aiMove = (await wasmAiService.getAIMove(gameState)).move;
            }

            if (!isCurrentTurn()) {
              return;
            }

            if (aiMove === null || !gameState.validMoves.includes(aiMove)) {
              if (gameState.validMoves.length > 0) {
                const fallbackMove = gameState.validMoves[0];
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
              console.warn('GameStore: Using deterministic fallback move:', fallbackMove);
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
