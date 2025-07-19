/// <reference lib="webworker" />

console.log('AI Worker: Script execution started.');

import type { GameState } from './types';
import type { ServerAIResponse } from './types';

interface WasmModule {
  default: (input?: string | URL) => Promise<unknown>;
  get_ai_move_wasm: (gameState: unknown) => string;
  get_classic_ai_move_optimized: (gameState: unknown) => string;
  init_classic_ai: () => string;
  clear_classic_ai_cache: () => string;
  init_ml_ai: () => string;
  roll_dice_wasm?: () => number;
}

let wasmModule: WasmModule;
let wasmReady: Promise<void> | null = null;
let classicAiInitialized = false;

const loadWasm = (): Promise<void> => {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    try {
      console.log('AI Worker: Starting to load WebAssembly module...');

      // Try to load the WASM module with better error handling
      try {
        wasmModule = await import(/* webpackIgnore: true */ '/wasm/rgou_ai_core.js');
        console.log('AI Worker: rgou_ai_core.js loaded successfully.');
      } catch (error) {
        console.error('AI Worker: Failed to load rgou_ai_core.js:', error);
        throw new Error(`Failed to load WASM JS module: ${error}`);
      }

      // Try to initialize the WASM module
      try {
        const wasmUrl = `${self.location.origin}/wasm/rgou_ai_core_bg.wasm`;
        console.log(`AI Worker: Initializing WASM with URL: ${wasmUrl}`);

        // Add more specific error handling for the WASM initialization
        await wasmModule.default(wasmUrl);
        console.log('AI Worker: WebAssembly module initialized successfully.');
      } catch (error) {
        console.error('AI Worker: Failed to initialize WASM:', error);
        throw new Error(`Failed to initialize WASM module: ${error}`);
      }

      // Verify the WASM module has the expected functions
      if (typeof wasmModule.get_ai_move_wasm !== 'function') {
        throw new Error('WASM module does not have get_ai_move_wasm function');
      }

      // Initialize Classic AI with persistent instance
      try {
        if (typeof wasmModule.init_classic_ai === 'function') {
          const initResponse = wasmModule.init_classic_ai();
          console.log('AI Worker: Classic AI initialized:', initResponse);
          classicAiInitialized = true;
        } else {
          console.warn('AI Worker: init_classic_ai function not available, using fallback');
        }
      } catch (error) {
        console.warn('AI Worker: Failed to initialize Classic AI, using fallback:', error);
      }

      // Initialize ML AI
      try {
        if (typeof wasmModule.init_ml_ai === 'function') {
          const mlInitResponse = wasmModule.init_ml_ai();
          console.log('AI Worker: ML AI initialized:', mlInitResponse);
        }
      } catch (error) {
        console.warn('AI Worker: Failed to initialize ML AI:', error);
      }

      console.log('AI Worker: WASM module loaded and verified successfully.');
    } catch (error) {
      console.error('AI Worker: Failed to load WebAssembly module:', error);
      throw new Error(`WebAssembly module failed to load: ${error}`);
    }
  })();

  return wasmReady;
};

const transformGameStateToRequest = (gameState: GameState) => ({
  player1Pieces: gameState.player1Pieces.map(p => ({ square: p.square })),
  player2Pieces: gameState.player2Pieces.map(p => ({ square: p.square })),
  currentPlayer: gameState.currentPlayer === 'player1' ? 'Player1' : 'Player2',
  diceRoll: gameState.diceRoll,
});

const transformWasmResponse = (responseJson: string): ServerAIResponse => {
  const parsed = JSON.parse(responseJson);
  return {
    ...parsed,
    move: parsed.move,
  };
};

const rollDice = (): number => {
  // Use WASM roll_dice_wasm if available, otherwise use Math.random
  if (typeof wasmModule.roll_dice_wasm === 'function') {
    return wasmModule.roll_dice_wasm();
  }

  // Fallback to Math.random for dice roll (0-4)
  return Math.floor(Math.random() * 5);
};

const getAIMove = (gameState: GameState): ServerAIResponse => {
  const request = transformGameStateToRequest(gameState);

  // Use optimized Classic AI if available, otherwise fallback to original
  if (classicAiInitialized && typeof wasmModule.get_classic_ai_move_optimized === 'function') {
    try {
      console.log('AI Worker: Using optimized Classic AI with persistent instance');
      const responseJson = wasmModule.get_classic_ai_move_optimized(request);
      return transformWasmResponse(responseJson);
    } catch (error) {
      console.warn('AI Worker: Optimized Classic AI failed, falling back to original:', error);
    }
  }

  // Fallback to original implementation
  console.log('AI Worker: Using original Classic AI implementation');
  const responseJson = wasmModule.get_ai_move_wasm(request);
  return transformWasmResponse(responseJson);
};

self.addEventListener(
  'message',
  async (event: MessageEvent<{ id: number; gameState?: GameState; type?: string }>) => {
    try {
      console.log('AI Worker: Received message:', event.data);
      await loadWasm();
      console.log('AI Worker: Wasm loaded, processing message.');

      const { id, gameState, type } = event.data;

      // Handle rollDice requests
      if (type === 'rollDice') {
        const diceRoll = rollDice();
        console.log('AI Worker: Rolling dice, result:', diceRoll);
        self.postMessage({ type: 'success', id, response: { diceRoll } });
        return;
      }

      // Handle cache clear requests
      if (type === 'clearCache') {
        if (typeof wasmModule.clear_classic_ai_cache === 'function') {
          const clearResponse = wasmModule.clear_classic_ai_cache();
          console.log('AI Worker: Cache cleared:', clearResponse);
          self.postMessage({ type: 'success', id, response: { message: 'Cache cleared' } });
        } else {
          self.postMessage({ type: 'error', id, error: 'Cache clear function not available' });
        }
        return;
      }

      // Handle AI move requests (default behavior)
      if (gameState) {
        const response = getAIMove(gameState);

        console.log('AI Worker: Sending success response:', { type: 'success', id, response });
        self.postMessage({ type: 'success', id, response });
      } else {
        throw new Error('No game state provided for AI move request');
      }
    } catch (error) {
      console.error('AI Worker: Error processing message:', error);
      console.log('AI Worker: Sending error response:', {
        type: 'error',
        id: event.data.id,
        error: (error as Error).message,
      });
      self.postMessage({ type: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
);

// Initialize WASM on worker startup
loadWasm()
  .then(() => {
    console.log('AI Worker: WASM initialized, sending ready signal.');
    self.postMessage({ type: 'ready' });
  })
  .catch(error => {
    console.error('AI Worker: Failed to initialize WASM on startup:', error);
    self.postMessage({ type: 'error', id: -1, error: error.message });
  });
