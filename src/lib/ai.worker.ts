/// <reference lib="webworker" />

import {
  AIWorkerRequestSchema,
  MLWeightsSchema,
  parseMLAIResponseJson,
  parseEngineAIResponseJson,
  toWasmGameState,
  type AIEngine,
} from './ai-protocol';

interface WasmModule {
  default: (input?: { module_or_path: string | URL }) => Promise<unknown>;
  get_ai_move_wasm: (gameState: unknown) => string;
  get_classic_ai_move_optimized: (gameState: unknown) => string;
  init_classic_ai: () => string;
  init_ml_ai: () => string;
  load_ml_weights: (valueWeights: number[], policyWeights: number[]) => void;
  get_ml_ai_move: (gameState: unknown) => string;
  init_heuristic_ai: () => string;
  get_heuristic_ai_move: (gameState: unknown) => string;
}

const WASM_MODULE_URL = '/wasm/rgou_ai_core.js';
let wasmModule: WasmModule;
let wasmReady: Promise<void> | null = null;
let classicAiInitialized = false;
let heuristicAiInitialized = false;
let mlAiInitialized = false;
let mlWeightsReady: Promise<void> | null = null;

function loadWasm(): Promise<void> {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    wasmModule = (await import(/* @vite-ignore */ WASM_MODULE_URL)) as WasmModule;
    await wasmModule.default({
      module_or_path: `${self.location.origin}/wasm/rgou_ai_worker_bg.wasm`,
    });

    wasmModule.init_classic_ai();
    classicAiInitialized = true;
    wasmModule.init_heuristic_ai();
    heuristicAiInitialized = true;
  })();

  return wasmReady;
}

async function parseGzipJson(response: Response): Promise<unknown> {
  if (!response.body || typeof DecompressionStream === 'undefined') {
    throw new Error('Streaming gzip decompression is unavailable');
  }

  const body = response.body.pipeThrough(new DecompressionStream('gzip'));
  return await new Response(body).json();
}

async function loadMLWeights(): Promise<void> {
  if (mlWeightsReady) return mlWeightsReady;

  mlWeightsReady = (async () => {
    if (!mlAiInitialized) {
      wasmModule.init_ml_ai();
      mlAiInitialized = true;
    }

    let value: unknown;
    try {
      const compressedResponse = await fetch('/ml-weights.json.gz');
      if (compressedResponse.ok) {
        value = await parseGzipJson(compressedResponse);
      }
    } catch (error) {
      console.warn('AI worker could not load the compressed model; using JSON fallback:', error);
    }

    if (value === undefined) {
      const jsonResponse = await fetch('/ml-weights.json');
      if (!jsonResponse.ok) {
        throw new Error(`ML weights request failed with ${jsonResponse.status}`);
      }
      value = await jsonResponse.json();
    }

    const weights = MLWeightsSchema.parse(value);
    wasmModule.load_ml_weights(weights.value_weights, weights.policy_weights);
  })();

  try {
    await mlWeightsReady;
  } catch (error) {
    mlWeightsReady = null;
    throw error;
  }
}

async function getMove(engine: AIEngine, position: Parameters<typeof toWasmGameState>[0]) {
  await loadWasm();
  const request = toWasmGameState(position);

  switch (engine) {
    case 'classic':
      return parseEngineAIResponseJson(
        classicAiInitialized
          ? wasmModule.get_classic_ai_move_optimized(request)
          : wasmModule.get_ai_move_wasm(request)
      );
    case 'heuristic':
      return parseEngineAIResponseJson(
        heuristicAiInitialized
          ? wasmModule.get_heuristic_ai_move(request)
          : wasmModule.get_ai_move_wasm(request)
      );
    case 'ml':
      await loadMLWeights();
      return parseMLAIResponseJson(wasmModule.get_ml_ai_move(request));
  }
}

self.addEventListener('message', async (event: MessageEvent) => {
  const parsed = AIWorkerRequestSchema.safeParse(event.data);
  if (!parsed.success) {
    const id =
      typeof event.data === 'object' && event.data && Number.isInteger(event.data.id)
        ? event.data.id
        : 0;
    self.postMessage({ type: 'error', id, error: 'Invalid AI worker request' });
    return;
  }

  const { id, engine, position } = parsed.data;
  try {
    const response = await getMove(engine, position);
    self.postMessage({ type: 'success', id, engine, response });
  } catch (error) {
    console.error(`AI worker ${engine} request failed:`, error);
    self.postMessage({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
