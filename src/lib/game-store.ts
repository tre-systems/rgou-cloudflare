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
            console.log('Initializing game from storage');
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
          console.group('Game Initialized');
          console.log('Initial State:', get().gameState);
          console.groupEnd();
        },
        processDiceRoll: (roll?: number) => {
          const oldState = get().gameState;
          set(state => {
            state.gameState = processDiceRollLogic(state.gameState, roll);
          });
          const newState = get().gameState;
          console.group(`Dice Roll by ${oldState.currentPlayer}`);
          console.log('Roll:', newState.diceRoll);
          console.log('New state:', newState);
          console.groupEnd();
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
                get().actions.postGameToServer();
              }

              console.group(`Player ${movePlayer} Move`);
              console.log('Moved piece at index:', pieceIndex);
              console.log('Move type:', moveType);
              console.log('Resulting state:', newState);
              console.groupEnd();
            }
          });
        },
        makeAIMove: async (aiSource: 'server' | 'client') => {
          const { gameState, actions } = get();
          if (gameState.currentPlayer !== 'player2' || !gameState.canMove) return;

          set(state => {
            state.aiThinking = true;
          });

          console.group(`AI Turn (source: ${aiSource})`);
          const startTime = performance.now();

          try {
            const aiResponseFromServer =
              aiSource === 'server'
                ? await AIService.getAIMove(gameState)
                : await wasmAiService.getAIMove(gameState);

            const aiResponse = { ...aiResponseFromServer, aiType: aiSource };
            const duration = performance.now() - startTime;
            console.log('AI Response:', aiResponse);
            console.log(`AI took ${duration.toFixed(2)}ms`);

            set(state => {
              state.lastAIMoveDuration = duration;
              state.lastAIDiagnostics = aiResponse;
            });

            const { move: aiMove } = aiResponse;

            if (aiMove === null || aiMove === undefined || !gameState.validMoves.includes(aiMove)) {
              console.warn(
                `AI returned invalid move ${aiMove}. Valid moves:`,
                gameState.validMoves
              );
              if (gameState.validMoves.length > 0) {
                actions.makeMove(gameState.validMoves[0]);
              }
            } else {
              actions.makeMove(aiMove);
            }
          } catch (error) {
            console.error('Error during AI move, using fallback:', error);
            const fallbackMove = AIService.getFallbackAIMove(gameState);
            console.log('Fallback move:', fallbackMove);
            actions.makeMove(fallbackMove);
          } finally {
            set(state => {
              state.aiThinking = false;
            });
            console.log('New state after AI move:', get().gameState);
            console.groupEnd();
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
          console.log('Game Reset.');
        },
        postGameToServer: async () => {
          const { gameState } = get();
          if (gameState.gameStatus !== 'finished' || !gameState.winner) {
            return;
          }
          try {
            const payload = {
              winner: gameState.winner,
              history: gameState.history,
              clientVersion: '1.0.0',
            };

            const result = await saveGame(payload);

            if (result?.success) {
              console.log('Game posted successfully.');
            } else {
              console.error(
                'Failed to post game to server (this is expected if offline):',
                result?.error
              );
            }
          } catch (error) {
            console.error('Failed to post game to server (this is expected if offline):', error);
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
