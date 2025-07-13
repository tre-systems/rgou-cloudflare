/// <reference lib="webworker" />

console.log('ML AI Worker: Script execution started.');

import type { GameState } from './types';

interface MLWasmModule {
  default: (input?: string | URL) => Promise<unknown>;
  init_ml_ai: () => void;
  load_ml_weights: (weights: unknown) => void;
  get_ml_ai_move: (gameState: unknown) => string;
  evaluate_ml_position: (gameState: unknown) => string;
  get_ml_ai_info: () => string;
  roll_dice_ml: () => number;
}

let mlWasmModule: MLWasmModule;
let mlWasmReady: Promise<void> | null = null;

const loadMLWasm = (): Promise<void> => {
  if (mlWasmReady) return mlWasmReady;

  mlWasmReady = (async () => {
    try {
      console.log('ML AI Worker: Starting to load ML WebAssembly module...');

      try {
        mlWasmModule = await import(/* webpackIgnore: true */ '/wasm/rgou_ml_ai_worker.js');
        console.log('ML AI Worker: rgou_ml_ai_worker.js loaded successfully.');
      } catch (error) {
        console.error('ML AI Worker: Failed to load rgou_ml_ai_worker.js:', error);
        throw new Error(`Failed to load ML WASM JS module: ${error}`);
      }

      try {
        const wasmUrl = `${self.location.origin}/wasm/rgou_ml_ai_worker_bg.wasm`;
        console.log(`ML AI Worker: Initializing ML WASM with URL: ${wasmUrl}`);

        await mlWasmModule.default(wasmUrl);
        console.log('ML AI Worker: ML WebAssembly module initialized successfully.');
      } catch (error) {
        console.error('ML AI Worker: Failed to initialize ML WASM:', error);
        throw new Error(`Failed to initialize ML WASM module: ${error}`);
      }

      if (typeof mlWasmModule.init_ml_ai !== 'function') {
        throw new Error('ML WASM module does not have init_ml_ai function');
      }

      mlWasmModule.init_ml_ai();
      console.log('ML AI Worker: ML AI initialized successfully.');
    } catch (error) {
      console.error('ML AI Worker: Failed to load ML WebAssembly module:', error);
      throw new Error(`ML WebAssembly module failed to load: ${error}`);
    }
  })();

  return mlWasmReady;
};

const transformGameStateToRequest = (gameState: GameState) => ({
  player1Pieces: gameState.player1Pieces.map(p => ({ square: p.square })),
  player2Pieces: gameState.player2Pieces.map(p => ({ square: p.square })),
  currentPlayer: gameState.currentPlayer === 'player1' ? 'Player1' : 'Player2',
  diceRoll: gameState.diceRoll,
});

const transformMLResponse = (responseJson: string) => {
  const parsed = JSON.parse(responseJson);
  return {
    move: parsed.move,
    evaluation: parsed.evaluation,
    thinking: parsed.thinking,
    diagnostics: parsed.diagnostics,
    timings: parsed.timings,
  };
};

self.addEventListener(
  'message',
  async (
    event: MessageEvent<{ id: number; type: string; gameState?: GameState; weights?: unknown }>
  ) => {
    try {
      console.log('ML AI Worker: Received message:', event.data);
      await loadMLWasm();
      console.log('ML AI Worker: ML Wasm loaded, processing message.');

      const { id, type } = event.data;

      switch (type) {
        case 'loadWeights':
          if (event.data.weights) {
            mlWasmModule.load_ml_weights(event.data.weights);
            self.postMessage({ type: 'success', id, response: { status: 'weights_loaded' } });
          } else {
            throw new Error('No weights provided');
          }
          break;

        case 'getAIMove':
          if (event.data.gameState) {
            const request = transformGameStateToRequest(event.data.gameState);
            const responseJson = mlWasmModule.get_ml_ai_move(request);
            const response = transformMLResponse(responseJson);

            console.log('ML AI Worker: Sending success response:', {
              type: 'success',
              id,
              response,
            });
            self.postMessage({ type: 'success', id, response });
          } else {
            throw new Error('No game state provided');
          }
          break;

        case 'evaluatePosition':
          if (event.data.gameState) {
            const request = transformGameStateToRequest(event.data.gameState);
            const responseJson = mlWasmModule.evaluate_ml_position(request);
            const response = JSON.parse(responseJson);

            console.log('ML AI Worker: Sending evaluation response:', {
              type: 'success',
              id,
              response,
            });
            self.postMessage({ type: 'success', id, response });
          } else {
            throw new Error('No game state provided');
          }
          break;

        case 'getInfo':
          const infoJson = mlWasmModule.get_ml_ai_info();
          const info = JSON.parse(infoJson);

          console.log('ML AI Worker: Sending info response:', {
            type: 'success',
            id,
            response: info,
          });
          self.postMessage({ type: 'success', id, response: info });
          break;

        case 'rollDice':
          const diceRoll = mlWasmModule.roll_dice_ml();

          console.log('ML AI Worker: Sending dice roll response:', {
            type: 'success',
            id,
            response: diceRoll,
          });
          self.postMessage({ type: 'success', id, response: diceRoll });
          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('ML AI Worker: Error processing message:', error);
      console.log('ML AI Worker: Sending error response:', {
        type: 'error',
        id: event.data.id,
        error: (error as Error).message,
      });
      self.postMessage({ type: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
);

// Initialize ML WASM on worker startup
loadMLWasm()
  .then(() => {
    console.log('ML AI Worker: ML WASM initialized, sending ready signal.');
    self.postMessage({ type: 'ready' });
  })
  .catch(error => {
    console.error('ML AI Worker: Failed to initialize ML WASM on startup:', error);
    self.postMessage({ type: 'error', id: -1, error: error.message });
  });
