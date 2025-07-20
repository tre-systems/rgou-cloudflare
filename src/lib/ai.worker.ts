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
  init_heuristic_ai: () => string;
  get_heuristic_ai_move: (gameState: unknown) => string;
  roll_dice_wasm?: () => number;
}

let wasmModule: WasmModule;
let wasmReady: Promise<void> | null = null;
let classicAiInitialized = false;
let heuristicAiInitialized = false;

const loadWasm = (): Promise<void> => {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    try {
      console.log('AI Worker: Starting to load WebAssembly module...');

      
      try {
        wasmModule = await import(/* webpackIgnore: true */ '/wasm/rgou_ai_core.js');
        console.log('AI Worker: rgou_ai_core.js loaded successfully.');
      } catch (error) {
        console.error('AI Worker: Failed to load rgou_ai_core.js:', error);
        throw new Error(`Failed to load WASM JS module: ${error}`);
      }

      
      try {
        const wasmUrl = `${self.location.origin}/wasm/rgou_ai_worker_bg.wasm`;
        console.log(`AI Worker: Initializing WASM with URL: ${wasmUrl}`);

        
        await wasmModule.default(wasmUrl);
        console.log('AI Worker: WebAssembly module initialized successfully.');
      } catch (error) {
        console.error('AI Worker: Failed to initialize WASM:', error);
        throw new Error(`Failed to initialize WASM module: ${error}`);
      }

      
      if (typeof wasmModule.get_ai_move_wasm !== 'function') {
        throw new Error('WASM module does not have get_ai_move_wasm function');
      }

      
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

      
      try {
        if (typeof wasmModule.init_ml_ai === 'function') {
          const mlInitResponse = wasmModule.init_ml_ai();
          console.log('AI Worker: ML AI initialized:', mlInitResponse);
        }
      } catch (error) {
        console.warn('AI Worker: Failed to initialize ML AI:', error);
      }

      
      try {
        if (typeof wasmModule.init_heuristic_ai === 'function') {
          const heuristicInitResponse = wasmModule.init_heuristic_ai();
          console.log('AI Worker: Heuristic AI initialized:', heuristicInitResponse);
          heuristicAiInitialized = true;
        } else {
          console.warn('AI Worker: init_heuristic_ai function not available');
        }
      } catch (error) {
        console.warn('AI Worker: Failed to initialize Heuristic AI:', error);
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
  
  if (typeof wasmModule.roll_dice_wasm === 'function') {
    return wasmModule.roll_dice_wasm();
  }

  
  const probabilities = [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16];
  const random = Math.random();

  let cumulativeProb = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProb += probabilities[i];
    if (random <= cumulativeProb) {
      return i;
    }
  }

  
  return 2;
};

const getAIMove = (gameState: GameState): ServerAIResponse => {
  const request = transformGameStateToRequest(gameState);

  
  if (classicAiInitialized && typeof wasmModule.get_classic_ai_move_optimized === 'function') {
    try {
      console.log('AI Worker: Using optimized Classic AI with persistent instance');
      const responseJson = wasmModule.get_classic_ai_move_optimized(request);
      return transformWasmResponse(responseJson);
    } catch (error) {
      console.warn('AI Worker: Optimized Classic AI failed, falling back to original:', error);
    }
  }

  
  console.log('AI Worker: Using original Classic AI implementation');
  const responseJson = wasmModule.get_ai_move_wasm(request);
  return transformWasmResponse(responseJson);
};

const getHeuristicAIMove = (gameState: GameState): ServerAIResponse => {
  const request = transformGameStateToRequest(gameState);

  
  if (heuristicAiInitialized && typeof wasmModule.get_heuristic_ai_move === 'function') {
    try {
      console.log('AI Worker: Using Heuristic AI');
      const responseJson = wasmModule.get_heuristic_ai_move(request);
      return transformWasmResponse(responseJson);
    } catch (error) {
      console.warn('AI Worker: Heuristic AI failed, falling back to Classic AI:', error);
    }
  }

  
  console.log('AI Worker: Heuristic AI not available, falling back to Classic AI');
  return getAIMove(gameState);
};

self.addEventListener(
  'message',
  async (event: MessageEvent<{ id: number; gameState?: GameState; type?: string }>) => {
    try {
      console.log('AI Worker: Received message:', event.data);
      await loadWasm();
      console.log('AI Worker: Wasm loaded, processing message.');

      const { id, gameState, type } = event.data;

      
      if (type === 'rollDice') {
        const diceRoll = rollDice();
        console.log('AI Worker: Rolling dice, result:', diceRoll);
        self.postMessage({ type: 'success', id, response: { diceRoll } });
        return;
      }

      
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

      
      if (gameState) {
        let response: ServerAIResponse;
        
        if (type === 'heuristic') {
          console.log('AI Worker: Processing Heuristic AI move request');
          response = getHeuristicAIMove(gameState);
        } else {
          console.log('AI Worker: Processing Classic AI move request');
          response = getAIMove(gameState);
        }

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


loadWasm()
  .then(() => {
    console.log('AI Worker: WASM initialized, sending ready signal.');
    self.postMessage({ type: 'ready' });
  })
  .catch(error => {
    console.error('AI Worker: Failed to initialize WASM on startup:', error);
    self.postMessage({ type: 'error', id: -1, error: error.message });
  });
