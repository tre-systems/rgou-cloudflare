import { describe, expect, it, vi } from 'vitest';
import { initializeGame, processDiceRoll } from '../game-logic';
import {
  parsePersistedGameState,
  parsePersistedGameStats,
  removeLegacyPlayerIdentity,
} from '../persist-storage';

describe('persisted state validation', () => {
  it('removes the identifier used by the retired result database', () => {
    localStorage.setItem('rgou-player-id', 'player_legacy');

    removeLegacyPlayerIdentity();

    expect(vi.mocked(localStorage.removeItem)).toHaveBeenCalledWith('rgou-player-id');
  });

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

  it('rebuilds derived board and legal-move projections during hydration', () => {
    const state = processDiceRoll(
      initializeGame(() => 0.1),
      4
    );
    const restored = parsePersistedGameState({
      ...state,
      board: Array(21).fill({ square: 0, player: 'player2' }),
      validMoves: [],
      canMove: false,
    });

    expect(restored?.board.every(square => square === null)).toBe(true);
    expect(restored?.validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(restored?.canMove).toBe(true);
  });
});
