/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameState } from './types';
import type { AIResponse as ServerAIResponse } from './ai-types';

class WasmAiService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private messageCounter = 0;
  private readonly pendingRequests = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

  constructor() {
    this.init();
  }

  private init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          console.log('Not in a browser environment, skipping worker initialization.');
          return resolve();
        }

        this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
          type: 'module',
        });

        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            console.log('AI Worker is ready.');
            resolve();
          } else if (event.data.type === 'success' || event.data.type === 'error') {
            const promise = this.pendingRequests.get(event.data.id);
            if (promise) {
              if (event.data.type === 'success') {
                promise.resolve(event.data.response);
              } else {
                promise.reject(new Error(event.data.error));
              }
              this.pendingRequests.delete(event.data.id);
            }
          }
        };

        const handleError = (error: ErrorEvent) => {
          console.error('AI Worker error:', error);
          reject(new Error('AI Worker failed to initialize.'));
        };

        this.worker.onmessage = handleMessage;
        this.worker.onerror = handleError;
      });
    }
    return this.initPromise;
  }

  private async ensureWorkerReady(): Promise<void> {
    if (!this.initPromise) {
      this.init();
    }
    await this.initPromise;
    if (!this.worker) {
      throw new Error('AI Worker not initialized.');
    }
  }

  async getAIMove(gameState: GameState): Promise<ServerAIResponse> {
    await this.ensureWorkerReady();

    const messageId = this.messageCounter++;
    const promise = new Promise<ServerAIResponse>((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });
    });

    this.worker!.postMessage({ id: messageId, gameState });

    return promise;
  }

  async rollDice(): Promise<number> {
    console.warn('rollDice in wasm-ai-service is not implemented with worker.');
    return Math.floor(Math.random() * 5);
  }
}

export const wasmAiService = new WasmAiService();
