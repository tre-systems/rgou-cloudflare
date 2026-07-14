import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIWorkerClient } from '../ai-worker-client';
import { initializeGame, processDiceRoll } from '../game-logic';

class FakeWorker {
  static instances: FakeWorker[] = [];
  static postError: Error | null = null;

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn(() => {
    if (FakeWorker.postError) throw FakeWorker.postError;
  });
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  respond(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('AIWorkerClient', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    FakeWorker.postError = null;
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reuses one worker and sends only the typed AI position', async () => {
    const client = new AIWorkerClient();
    const gameState = processDiceRoll(
      initializeGame(() => 0.1),
      2
    );

    const responsePromise = client.request('classic', gameState);
    const worker = FakeWorker.instances[0];
    expect(worker.postMessage).toHaveBeenCalledWith({
      id: 0,
      type: 'getMove',
      engine: 'classic',
      position: {
        player1Squares: [-1, -1, -1, -1, -1, -1, -1],
        player2Squares: [-1, -1, -1, -1, -1, -1, -1],
        currentPlayer: 'player1',
        diceRoll: 2,
      },
    });

    worker.respond({ type: 'success', id: 0, engine: 'classic', response: { move: 0 } });
    await expect(responsePromise).resolves.toEqual({ move: 0 });

    const secondPromise = client.request('heuristic', gameState);
    expect(FakeWorker.instances).toHaveLength(1);
    worker.respond({ type: 'success', id: 1, engine: 'heuristic', response: { move: 1 } });
    await expect(secondPromise).resolves.toEqual({ move: 1 });
  });

  it('terminates a timed-out worker so the next request starts cleanly', async () => {
    vi.useFakeTimers();
    const client = new AIWorkerClient();
    const gameState = processDiceRoll(
      initializeGame(() => 0.1),
      2
    );
    const responsePromise = client.request('ml', gameState);
    const firstWorker = FakeWorker.instances[0];

    const rejection = expect(responsePromise).rejects.toThrow('ml AI request timed out');
    await vi.advanceTimersByTimeAsync(30_000);
    await rejection;
    expect(firstWorker.terminate).toHaveBeenCalledOnce();

    const secondRequest = client.request('classic', gameState);
    expect(FakeWorker.instances).toHaveLength(2);
    const secondRejection = expect(secondRequest).rejects.toThrow('AI worker terminated');
    client.terminate();
    await secondRejection;
  });

  it('rejects immediately when posting or decoding a message fails', async () => {
    const gameState = processDiceRoll(
      initializeGame(() => 0.1),
      2
    );
    const postFailure = new Error('clone failed');
    FakeWorker.postError = postFailure;

    const failedPostClient = new AIWorkerClient();
    await expect(failedPostClient.request('classic', gameState)).rejects.toThrow('clone failed');
    expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();

    FakeWorker.postError = null;
    const invalidResponseClient = new AIWorkerClient();
    const response = invalidResponseClient.request('classic', gameState);
    FakeWorker.instances[1].respond({ invalid: true });

    await expect(response).rejects.toThrow('AI worker returned an invalid response');
    expect(FakeWorker.instances[1].terminate).toHaveBeenCalledOnce();
  });
});
