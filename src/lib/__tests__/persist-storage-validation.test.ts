import { describe, expect, it } from 'vitest';
import { initializeGame } from '../game-logic';
import { parsePersistedGameState, parsePersistedGameStats } from '../persist-storage';

describe('persisted state validation', () => {
  it('accepts valid game and statistics state', () => {
    expect(parsePersistedGameState(initializeGame())).not.toBeNull();
    expect(parsePersistedGameStats({ wins: 2, losses: 1, gamesPlayed: 3 })).toEqual({
      wins: 2,
      losses: 1,
      gamesPlayed: 3,
    });
  });

  it('rejects malformed or inconsistent persisted state', () => {
    expect(
      parsePersistedGameState({
        ...initializeGame(),
        player1Pieces: [],
      })
    ).toBeNull();
    expect(parsePersistedGameStats({ wins: 2, losses: 1, gamesPlayed: 99 })).toBeNull();
    expect(parsePersistedGameStats({ wins: -1, losses: 1, gamesPlayed: 0 })).toBeNull();
  });
});
