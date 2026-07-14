import {
  AIWorkerResponseSchema,
  toAIPosition,
  type AIEngine,
  type AIWorkerRequest,
} from './ai-protocol';
import type { GameState } from './schemas';

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const AI_REQUEST_TIMEOUT_MS = 30_000;

export class AIWorkerClient {
  private worker: Worker | null = null;
  private messageCounter = 0;
  private readonly pendingRequests = new Map<number, PendingRequest>();

  request(engine: AIEngine, gameState: GameState): Promise<unknown> {
    const worker = this.getWorker();
    const id = this.messageCounter++;
    const request: AIWorkerRequest = {
      id,
      type: 'getMove',
      engine,
      position: toAIPosition(gameState),
    };

    const response = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        this.restart(new Error(`${engine} AI request timed out`));
        reject(new Error(`${engine} AI request timed out`));
      }, AI_REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, { resolve, reject, timeout });
    });

    worker.postMessage(request);
    return response;
  }

  terminate(): void {
    this.restart(new Error('AI worker terminated'));
  }

  private getWorker(): Worker {
    if (typeof window === 'undefined') {
      throw new Error('AI worker is only available in the browser');
    }

    if (!this.worker) {
      this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = event => this.handleMessage(event);
      this.worker.onerror = event => {
        console.error('AI worker failed:', event.message, event);
        this.restart(new Error(`AI worker failed: ${event.message}`));
      };
    }

    return this.worker;
  }

  private handleMessage(event: MessageEvent): void {
    const result = AIWorkerResponseSchema.safeParse(event.data);
    if (!result.success) {
      console.error('AI worker returned an invalid response:', result.error);
      return;
    }

    const response = result.data;
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.type === 'success') {
      pending.resolve(response.response);
    } else {
      pending.reject(new Error(response.error));
    }
  }

  private restart(reason: Error): void {
    this.worker?.terminate();
    this.worker = null;

    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(reason);
    }
    this.pendingRequests.clear();
  }
}

export const aiWorkerClient = new AIWorkerClient();
