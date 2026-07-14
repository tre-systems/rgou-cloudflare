import { beforeEach, describe, expect, it } from 'vitest';
import { useStatsStore } from '../stats-store';

function resetStatsStore(): void {
  useStatsStore.setState({
    stats: { wins: 0, losses: 0, gamesPlayed: 0 },
    actions: useStatsStore.getState().actions,
  });
}

describe('StatsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStatsStore();
  });

  it.each([
    ['incrementWins', { wins: 1, losses: 0, gamesPlayed: 1 }],
    ['incrementLosses', { wins: 0, losses: 1, gamesPlayed: 1 }],
  ] as const)('%s records one completed game', (action, expected) => {
    useStatsStore.getState().actions[action]();

    expect(useStatsStore.getState().stats).toEqual(expected);
  });

  it('preserves existing results and maintains the total', () => {
    useStatsStore.setState(state => ({
      ...state,
      stats: { wins: 3, losses: 5, gamesPlayed: 8 },
    }));

    const { incrementWins, incrementLosses } = useStatsStore.getState().actions;
    incrementWins();
    incrementLosses();
    incrementWins();

    expect(useStatsStore.getState().stats).toEqual({ wins: 5, losses: 6, gamesPlayed: 11 });
  });
});
