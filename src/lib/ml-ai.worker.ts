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
let weightsLoaded = false;
const networkConfig: {
  value?: { inputSize: number; hiddenSizes: number[]; outputSize: number };
  policy?: { inputSize: number; hiddenSizes: number[]; outputSize: number };
} = {};

console.log('ML AI Worker: Variables initialized');

const loadMLWasm = (): Promise<void> => {
  if (mlWasmReady) return mlWasmReady;

  console.log('ML AI Worker: Starting loadMLWasm function');
  mlWasmReady = (async () => {
    try {
      console.log('ML AI Worker: Starting to load ML WebAssembly module...');
      console.log('ML AI Worker: Current location:', self.location.href);
      console.log('ML AI Worker: Current origin:', self.location.origin);

      try {
        console.log('ML AI Worker: Attempting to import ml_ai_core.js...');
        mlWasmModule = await import(/* webpackIgnore: true */ '/wasm/ml_ai_core.js');
        console.log('ML AI Worker: ml_ai_core.js loaded successfully.');
        console.log('ML AI Worker: Module keys:', Object.keys(mlWasmModule));
      } catch (error) {
        console.error('ML AI Worker: Failed to load ml_ai_core.js:', error);
        throw new Error(`Failed to load ML WASM JS module: ${error}`);
      }

      try {
        const wasmUrl = `${self.location.origin}/wasm/ml_ai_core_bg.wasm`;
        console.log(`ML AI Worker: Initializing ML WASM with URL: ${wasmUrl}`);

        await mlWasmModule.default(wasmUrl);
        console.log('ML AI Worker: ML WebAssembly module initialized successfully.');
      } catch (error) {
        console.error('ML AI Worker: Failed to initialize ML WASM:', error);
        throw new Error(`Failed to initialize ML WASM module: ${error}`);
      }

      if (typeof mlWasmModule.init_ml_ai !== 'function') {
        console.error(
          'ML AI Worker: Available functions:',
          Object.keys(mlWasmModule).filter(
            key => typeof (mlWasmModule as unknown as Record<string, unknown>)[key] === 'function'
          )
        );
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

const transformGameStateToRequest = (gameState: GameState) => {
  console.log('ML AI Worker: Transforming game state for WASM...');
  console.log('ML AI Worker: Original game state:', {
    currentPlayer: gameState.currentPlayer,
    diceRoll: gameState.diceRoll,
    validMoves: gameState.validMoves,
    player1Pieces: gameState.player1Pieces.length,
    player2Pieces: gameState.player2Pieces.length,
  });

  const request = {
    player1Pieces: gameState.player1Pieces.map(p => ({ square: p.square })),
    player2Pieces: gameState.player2Pieces.map(p => ({ square: p.square })),
    currentPlayer: gameState.currentPlayer === 'player1' ? 'Player1' : 'Player2',
    diceRoll: gameState.diceRoll,
  };

  console.log('ML AI Worker: Transformed request:', request);
  return request;
};

const transformMLResponse = (responseJson: string) => {
  console.log('ML AI Worker: Transforming ML response...');
  console.log('ML AI Worker: Raw response JSON:', responseJson);

  const parsed = JSON.parse(responseJson);
  console.log('ML AI Worker: Parsed response:', parsed);

  const response = {
    move: parsed.move,
    evaluation: parsed.evaluation,
    thinking: parsed.thinking,
    diagnostics: parsed.diagnostics,
    timings: parsed.timings,
  };

  console.log('ML AI Worker: Final transformed response:', response);
  return response;
};

const logGameStateAnalysis = (gameState: GameState) => {
  console.log('ML AI Worker: === GAME STATE ANALYSIS ===');
  console.log('ML AI Worker: Current player:', gameState.currentPlayer);
  console.log('ML AI Worker: Dice roll:', gameState.diceRoll);
  console.log('ML AI Worker: Valid moves count:', gameState.validMoves.length);
  console.log('ML AI Worker: Valid moves:', gameState.validMoves);

  const player1OnBoard = gameState.player1Pieces.filter(p => p.square >= 0 && p.square < 20).length;
  const player2OnBoard = gameState.player2Pieces.filter(p => p.square >= 0 && p.square < 20).length;
  const player1Finished = gameState.player1Pieces.filter(p => p.square === 20).length;
  const player2Finished = gameState.player2Pieces.filter(p => p.square === 20).length;

  console.log('ML AI Worker: Player 1 - On board:', player1OnBoard, 'Finished:', player1Finished);
  console.log('ML AI Worker: Player 2 - On board:', player2OnBoard, 'Finished:', player2Finished);

  const rosetteSquares = [0, 7, 13, 15, 16];
  const player1OnRosettes = gameState.player1Pieces.filter(p =>
    rosetteSquares.includes(p.square)
  ).length;
  const player2OnRosettes = gameState.player2Pieces.filter(p =>
    rosetteSquares.includes(p.square)
  ).length;

  console.log(
    'ML AI Worker: Rosette control - Player 1:',
    player1OnRosettes,
    'Player 2:',
    player2OnRosettes
  );
  console.log('ML AI Worker: ===============================');
};

self.addEventListener(
  'message',
  async (
    event: MessageEvent<{ id: number; type: string; gameState?: GameState; weights?: unknown }>
  ) => {
    try {
      console.log('ML AI Worker: Received message:', event.data);
      console.log('ML AI Worker: Message type:', event.data.type);
      console.log('ML AI Worker: Message id:', event.data.id);

      await loadMLWasm();
      console.log('ML AI Worker: ML Wasm loaded, processing message.');

      const { id, type } = event.data;

      switch (type) {
        case 'loadWeights':
          if (event.data.weights) {
            console.log('ML AI Worker: Loading weights into WASM...');
            const weights = event.data.weights as {
              valueWeights: number[];
              policyWeights: number[];
              valueNetworkConfig?: { inputSize: number; hiddenSizes: number[]; outputSize: number };
              policyNetworkConfig?: {
                inputSize: number;
                hiddenSizes: number[];
                outputSize: number;
              };
            };

            if (weights.valueWeights) {
              console.log('ML AI Worker: Value weights size:', weights.valueWeights.length);
              networkConfig.value = weights.valueNetworkConfig;
              console.log('ML AI Worker: Value network config:', weights.valueNetworkConfig);
            }

            if (weights.policyWeights) {
              console.log('ML AI Worker: Policy weights size:', weights.policyWeights.length);
              networkConfig.policy = weights.policyNetworkConfig;
              console.log('ML AI Worker: Policy network config:', weights.policyNetworkConfig);
            }

            mlWasmModule.load_ml_weights(event.data.weights);
            weightsLoaded = true;
            console.log('ML AI Worker: Weights loaded successfully into WASM');
            self.postMessage({ type: 'success', id, response: { status: 'weights_loaded' } });
          } else {
            throw new Error('No weights provided');
          }
          break;

        case 'getAIMove':
          if (event.data.gameState) {
            console.log('ML AI Worker: === AI MOVE REQUEST ===');
            logGameStateAnalysis(event.data.gameState);

            if (!weightsLoaded) {
              console.warn('ML AI Worker: Weights not loaded, using untrained networks');
            }

            const startTime = performance.now();
            const request = transformGameStateToRequest(event.data.gameState);

            console.log('ML AI Worker: Calling WASM get_ml_ai_move...');
            const responseJson = mlWasmModule.get_ml_ai_move(request);
            const wasmTime = performance.now() - startTime;

            console.log('ML AI Worker: WASM response received in', wasmTime.toFixed(2), 'ms');
            const response = transformMLResponse(responseJson);

            console.log('ML AI Worker: AI decision analysis:');
            console.log('ML AI Worker: - Chosen move:', response.move);
            console.log(
              'ML AI Worker: - Position evaluation:',
              typeof response.evaluation === 'number'
                ? response.evaluation.toFixed(3)
                : response.evaluation
            );
            console.log('ML AI Worker: - AI reasoning:', response.thinking);
            console.log(
              'ML AI Worker: - Move evaluations analyzed:',
              Array.isArray(response.diagnostics.move_evaluations)
                ? response.diagnostics.move_evaluations.length
                : 0
            );
            console.log(
              'ML AI Worker: - Value network output:',
              typeof response.diagnostics.value_network_output === 'number'
                ? response.diagnostics.value_network_output.toFixed(3)
                : response.diagnostics.value_network_output
            );
            console.log(
              'ML AI Worker: - Policy network outputs:',
              Array.isArray(response.diagnostics.policy_network_outputs)
                ? response.diagnostics.policy_network_outputs.length
                : 0
            );
            console.log(
              'ML AI Worker: - WASM calculation time:',
              typeof response.timings.aiMoveCalculation === 'number'
                ? response.timings.aiMoveCalculation.toFixed(2)
                : response.timings.aiMoveCalculation,
              'ms'
            );
            console.log(
              'ML AI Worker: - Total handler time:',
              typeof response.timings.totalHandlerTime === 'number'
                ? response.timings.totalHandlerTime.toFixed(2)
                : response.timings.totalHandlerTime,
              'ms'
            );

            if (
              Array.isArray(response.diagnostics.move_evaluations) &&
              response.diagnostics.move_evaluations.length > 0
            ) {
              console.log('ML AI Worker: Top move evaluations:');
              response.diagnostics.move_evaluations
                .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
                .slice(0, 3)
                .forEach(
                  (
                    move: { piece_index: number; score: number; move_type: string },
                    index: number
                  ) => {
                    console.log(
                      `ML AI Worker:   ${index + 1}. Piece ${move.piece_index}: ${typeof move.score === 'number' ? move.score.toFixed(3) : move.score} (${move.move_type})`
                    );
                  }
                );
            }

            console.log('ML AI Worker: =======================');

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
            console.log('ML AI Worker: === POSITION EVALUATION ===');
            logGameStateAnalysis(event.data.gameState);

            const request = transformGameStateToRequest(event.data.gameState);
            console.log('ML AI Worker: Calling WASM evaluate_ml_position...');

            const responseJson = mlWasmModule.evaluate_ml_position(request);
            const response = JSON.parse(responseJson);

            console.log('ML AI Worker: Position evaluation result:', response);
            console.log('ML AI Worker: ===========================');

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
          console.log('ML AI Worker: Getting AI info...');
          const infoJson = mlWasmModule.get_ml_ai_info();
          const info = JSON.parse(infoJson);

          console.log('ML AI Worker: AI info:', info);
          console.log('ML AI Worker: Weights loaded:', weightsLoaded);
          console.log('ML AI Worker: Network config:', networkConfig);

          console.log('ML AI Worker: Sending info response:', {
            type: 'success',
            id,
            response: info,
          });
          self.postMessage({ type: 'success', id, response: info });
          break;

        case 'rollDice':
          console.log('ML AI Worker: Rolling dice...');
          const diceRoll = mlWasmModule.roll_dice_ml();
          console.log('ML AI Worker: Dice roll result:', diceRoll);

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

console.log('ML AI Worker: Starting initialization on worker startup');
loadMLWasm()
  .then(() => {
    console.log('ML AI Worker: ML WASM initialized, sending ready signal.');
    self.postMessage({ type: 'ready' });
  })
  .catch(error => {
    console.error('ML AI Worker: Failed to initialize ML WASM on startup:', error);
    self.postMessage({ type: 'error', id: -1, error: error.message });
  });

console.log('ML AI Worker: Worker script loaded and event listeners attached');
