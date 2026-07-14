import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestGameState } from './test-utils';
import {
  gameCompletedUsage,
  gameStartedUsage,
  parseUsageEvent,
  reportUsage,
  usageDataPoint,
} from '../usage';

describe('usage reporting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds anonymous lifecycle events and Analytics Engine points', () => {
    const started = gameStartedUsage('classic', 'player1');
    expect(started).toEqual({
      event: 'game_started',
      mode: 'classic',
      player1: 'human',
      player2: 'classic',
      startedBy: 'player1',
    });
    expect(usageDataPoint(started)).toEqual({
      indexes: ['rgou'],
      blobs: ['game_started', 'classic', 'human', 'classic', 'player1', ''],
      doubles: [1, 0, 0],
    });
  });

  it('validates a completed event without retaining move history', () => {
    const game = createTestGameState({
      gameStatus: 'finished',
      winner: 'player1',
      startTime: Date.now() - 500,
      history: [
        {
          player: 'player1',
          diceRoll: 1,
          pieceIndex: 0,
          fromSquare: 13,
          toSquare: 20,
          moveType: 'finish',
        },
      ],
    });
    const completed = gameCompletedUsage('watch', game);
    expect(completed).toMatchObject({
      event: 'game_completed',
      mode: 'watch',
      player1: 'classic',
      player2: 'ml',
      winner: 'player1',
      moves: 1,
    });
    expect(completed).not.toHaveProperty('history');
    expect(parseUsageEvent(completed)).toEqual(completed);
  });

  it('rejects unknown events and extra fields', () => {
    expect(parseUsageEvent({ event: 'page_view' })).toBeNull();
    expect(
      parseUsageEvent({ ...gameStartedUsage('ml', 'player2'), playerId: 'secret' })
    ).toBeNull();
  });

  it('uses sendBeacon when available and fetch as a fallback', () => {
    const event = gameStartedUsage('heuristic', 'player1');
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    reportUsage(event);
    expect(beacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();

    beacon.mockReturnValue(false);
    reportUsage(event);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/usage',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
