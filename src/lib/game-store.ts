import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, MoveType, Player, AIResponse } from './schemas';
import {
  initializeGame,
  processDiceRoll as processDiceRollLogic,
  makeMove as makeMoveLogic,
} from './game-logic';
import { AIService } from './ai-service';
import { wasmAiService } from './wasm-ai-service';
import { useStatsStore } from './stats-store';
import { saveGame } from '@/app/actions';
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
    makeMove: (pieceIndex: number) => void;
    makeAIMove: (aiSource: 'server' | 'client') => Promise<void>;
    reset: () => void;
    postGameToServer: () => Promise<void>;
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
        makeAIMove: async (aiSource: 'server' | 'client') => {
          const { gameState, actions } = get();
          if (gameState.currentPlayer !== 'player2' || !gameState.canMove) return;

          set(state => {
            state.aiThinking = true;
          });

          const startTime = performance.now();

          try {
            const aiResponseFromServer =
              aiSource === 'server'
                ? await AIService.getAIMove(gameState)
                : await wasmAiService.getAIMove(gameState);

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
