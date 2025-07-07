import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { GameState, MoveType, Player } from "./types";
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
  lastMoveType: MoveType | null;
  lastMovePlayer: Player | null;
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
    lastMoveType: null,
    lastMovePlayer: null,
    actions: {
      initialize: () => {
        set((state) => {
          state.gameState = initializeGame();
          state.aiThinking = false;
          state.lastAIDiagnostics = null;
          state.lastAIMoveDuration = null;
          state.lastMoveType = null;
          state.lastMovePlayer = null;
        });
        console.group("Game Initialized");
        console.log("Initial State:", get().gameState);
        console.groupEnd();
      },
      processDiceRoll: (roll?: number) => {
        const oldState = get().gameState;
        set((state) => {
          state.gameState = processDiceRollLogic(state.gameState, roll);
        });
        const newState = get().gameState;
        console.group(`Dice Roll by ${oldState.currentPlayer}`);
        console.log("Roll:", newState.diceRoll);
        console.log("New state:", newState);
        console.groupEnd();
      },
      makeMove: (pieceIndex: number) => {
        set((state) => {
          if (
            state.gameState.canMove &&
            state.gameState.validMoves.includes(pieceIndex)
          ) {
            const [newState, moveType, movePlayer] = makeMoveLogic(
              state.gameState,
              pieceIndex,
            );
            state.gameState = newState;
            state.lastMoveType = moveType;
            state.lastMovePlayer = movePlayer;

            console.group(`Player ${movePlayer} Move`);
            console.log("Moved piece at index:", pieceIndex);
            console.log("Move type:", moveType);
            console.log("Resulting state:", newState);
            console.groupEnd();
          }
        });
      },
      makeAIMove: async (aiSource: "server" | "client") => {
        const { gameState } = get();
        if (gameState.currentPlayer !== "player2" || !gameState.canMove) return;

        set((state) => {
          state.aiThinking = true;
        });

        console.group(`AI Turn (source: ${aiSource})`);
        const startTime = performance.now();

        try {
          const aiResponse =
            aiSource === "server"
              ? await AIService.getAIMove(gameState)
              : await wasmAiService.getAIMove(gameState);

          const duration = performance.now() - startTime;
          console.log("AI Response:", aiResponse);
          console.log(`AI took ${duration.toFixed(2)}ms`);

          set((state) => {
            state.lastAIMoveDuration = duration;
            state.lastAIDiagnostics = aiResponse;
          });

          const { move: aiMove } = aiResponse;

          if (aiMove === undefined || !gameState.validMoves.includes(aiMove)) {
            console.warn(
              `AI returned invalid move ${aiMove}. Valid moves:`,
              gameState.validMoves,
            );
            console.error("AI diagnostics:", aiResponse.diagnostics);
            console.error("Client gameState:", gameState);
            if (gameState.validMoves.length > 0) {
              const fallbackMove = gameState.validMoves[0];
              set((state) => {
                const [newState, moveType, movePlayer] = makeMoveLogic(
                  state.gameState,
                  fallbackMove,
                );
                state.gameState = newState;
                state.lastMoveType = moveType;
                state.lastMovePlayer = movePlayer;
              });
            }
          } else {
            set((state) => {
              const [newState, moveType, movePlayer] = makeMoveLogic(
                state.gameState,
                aiMove,
              );
              state.gameState = newState;
              state.lastMoveType = moveType;
              state.lastMovePlayer = movePlayer;
            });
          }
        } catch (error) {
          console.warn("AI service unavailable, using fallback:", error);
          const fallbackMove = AIService.getFallbackAIMove(gameState);
          set((state) => {
            const [newState, moveType, movePlayer] = makeMoveLogic(
              state.gameState,
              fallbackMove,
            );
            state.gameState = newState;
            state.lastMoveType = moveType;
            state.lastMovePlayer = movePlayer;
            state.lastAIDiagnostics = null;
          });
        } finally {
          set((state) => {
            state.aiThinking = false;
          });
          console.log("New state after AI move:", get().gameState);
          console.groupEnd();
        }
      },
      reset: () => {
        set((state) => {
          state.gameState = initializeGame();
          state.aiThinking = false;
          state.lastAIDiagnostics = null;
          state.lastAIMoveDuration = null;
          state.lastMoveType = null;
          state.lastMovePlayer = null;
        });
        console.log("Game Reset.");
      },
    },
  })),
);

export const useGameActions = () => useGameStore((state) => state.actions);

export const useGameState = () => useGameStore((state) => state.gameState);
