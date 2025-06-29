import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { GameState } from "./types";
import {
  initializeGame,
  processDiceRoll as processDiceRollLogic,
  makeMove as makeMoveLogic,
} from "./game-logic";
import { AIService, AIResponse } from "./ai-service";
import { wasmAiService } from "./wasm-ai-service";

type GameStore = {
  gameState: GameState;
  aiThinking: boolean;
  lastAIDiagnostics: AIResponse | null;
  lastAIMoveDuration: number | null;
  actions: {
    initialize: () => void;
    processDiceRoll: (roll?: number) => void;
    makeMove: (pieceIndex: number) => void;
    makeAIMove: (aiSource: "server" | "client") => Promise<void>;
    reset: () => void;
  };
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameState: initializeGame(),
    aiThinking: false,
    lastAIDiagnostics: null,
    lastAIMoveDuration: null,
    actions: {
      initialize: () => {
        set((state) => {
          state.gameState = initializeGame();
          state.aiThinking = false;
          state.lastAIDiagnostics = null;
          state.lastAIMoveDuration = null;
        });
      },
      processDiceRoll: (roll?: number) => {
        set((state) => {
          state.gameState = processDiceRollLogic(state.gameState, roll);
        });
      },
      makeMove: (pieceIndex: number) => {
        set((state) => {
          if (
            state.gameState.canMove &&
            state.gameState.validMoves.includes(pieceIndex)
          ) {
            state.gameState = makeMoveLogic(state.gameState, pieceIndex);
          }
        });
      },
      makeAIMove: async (aiSource: "server" | "client") => {
        const { gameState } = get();
        if (gameState.currentPlayer !== "player2" || !gameState.canMove) return;

        set((state) => {
          state.aiThinking = true;
        });

        const startTime = performance.now();

        try {
          const aiResponse =
            aiSource === "server"
              ? await AIService.getAIMove(gameState)
              : await wasmAiService.getAIMove(gameState);

          const duration = performance.now() - startTime;

          set((state) => {
            state.lastAIMoveDuration = duration;
            state.lastAIDiagnostics = aiResponse;
          });

          if (!gameState.validMoves.includes(aiResponse.move)) {
            console.warn(
              `AI returned invalid move ${aiResponse.move}. Valid moves:`,
              gameState.validMoves,
            );
            if (gameState.validMoves.length > 0) {
              const fallbackMove = gameState.validMoves[0];
              set((state) => {
                state.gameState = makeMoveLogic(state.gameState, fallbackMove);
              });
            }
          } else {
            set((state) => {
              state.gameState = makeMoveLogic(state.gameState, aiResponse.move);
            });
          }
        } catch (error) {
          console.warn("AI service unavailable, using fallback:", error);
          const fallbackMove = AIService.getFallbackAIMove(gameState);
          set((state) => {
            state.gameState = makeMoveLogic(state.gameState, fallbackMove);
            state.lastAIDiagnostics = null;
          });
        } finally {
          set((state) => {
            state.aiThinking = false;
          });
        }
      },
      reset: () => {
        set((state) => {
          state.gameState = initializeGame();
          state.aiThinking = false;
          state.lastAIDiagnostics = null;
          state.lastAIMoveDuration = null;
        });
      },
    },
  })),
);

export const useGameActions = () => useGameStore((state) => state.actions);

export const useGameState = () => useGameStore((state) => state.gameState);
