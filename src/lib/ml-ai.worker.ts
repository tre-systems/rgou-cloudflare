/// <reference lib="webworker" />

import type { GameState } from './types';

interface MLWasmModule {
  default: (input?: string | URL) => Promise<unknown>;
  init_ml_ai: () => void;
  load_ml_weights: (valueWeights: number[], policyWeights: number[]) => void;
  get_ml_ai_move: (gameState: unknown) => string;
}

let mlWasmModule: MLWasmModule;
let mlWasmReady: Promise<void> | null = null;
let weightsLoaded = false;

const loadMLWasm = (): Promise<void> => {
  if (mlWasmReady) return mlWasmReady;

  mlWasmReady = (async () => {
    try {
      mlWasmModule = await import(/* webpackIgnore: true */ '/wasm/rgou_ai_core.js');

      const wasmUrl = `${self.location.origin}/wasm/rgou_ai_worker_bg.wasm`;
      await mlWasmModule.default(wasmUrl);

      if (typeof mlWasmModule.init_ml_ai !== 'function') {
        throw new Error('ML WASM module does not have init_ml_ai function');
      }

      mlWasmModule.init_ml_ai();
    } catch (error) {
      console.error('ML AI Worker: Failed to load ML WebAssembly module:', error);
      throw new Error(`ML WebAssembly module failed to load: ${error}`);
    }
  })();

  return mlWasmReady;
};

const transformGameStateToRequest = (gameState: GameState) => {
  return {
    player1Pieces: gameState.player1Pieces.map(p => ({ square: p.square })),
    player2Pieces: gameState.player2Pieces.map(p => ({ square: p.square })),
    currentPlayer: gameState.currentPlayer === 'player1' ? 'Player1' : 'Player2',
    diceRoll: gameState.diceRoll,
  };
};

const transformMLResponse = (responseJson: string) => {
  const parsed = JSON.parse(responseJson);
  return {
    move: parsed.move,
    evaluation: parsed.evaluation,
    thinking: parsed.thinking,
    diagnostics: parsed.diagnostics,
    timings: parsed.timings || {},
  };
};

self.addEventListener(
  'message',
  async (
    event: MessageEvent<{ id: number; type: string; gameState?: GameState; weights?: unknown }>
  ) => {
    try {
      await loadMLWasm();

      const { id, type } = event.data;

      switch (type) {
        case 'loadWeights':
          if (event.data.weights) {
            const weights = event.data.weights as {
              value_weights: number[];
              policy_weights: number[];
            };
            mlWasmModule.load_ml_weights(weights.value_weights, weights.policy_weights);
            weightsLoaded = true;
            self.postMessage({ type: 'success', id, response: { status: 'weights_loaded' } });
          } else {
            throw new Error('No weights provided');
          }
          break;

        case 'getAIMove':
          if (event.data.gameState) {
            if (!weightsLoaded) {
              console.warn('ML AI Worker: weights not loaded, using untrained networks');
            }
            const request = transformGameStateToRequest(event.data.gameState);
            const responseJson = mlWasmModule.get_ml_ai_move(request);
            self.postMessage({ type: 'success', id, response: transformMLResponse(responseJson) });
          } else {
            throw new Error('No game state provided');
          }
          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('ML AI Worker: Error processing message:', error);
      self.postMessage({ type: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
);

loadMLWasm()
  .then(() => {
    self.postMessage({ type: 'ready' });
  })
  .catch(error => {
    console.error('ML AI Worker: Failed to initialize ML WASM on startup:', error);
    self.postMessage({ type: 'error', id: -1, error: error.message });
  });
