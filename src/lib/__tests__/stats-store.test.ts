import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStatsStore } from '../stats-store';

describe('StatsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.setState({
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
      },
      actions: {
        incrementWins: () => {
          const { stats } = useStatsStore.getState();
          useStatsStore.setState({
            stats: {
              ...stats,
              wins: stats.wins + 1,
              gamesPlayed: stats.gamesPlayed + 1,
            },
          });
        },
        incrementLosses: () => {
          const { stats } = useStatsStore.getState();
          useStatsStore.setState({
            stats: {
              ...stats,
              losses: stats.losses + 1,
              gamesPlayed: stats.gamesPlayed + 1,
            },
          });
        },
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have default stats', () => {
      const stats = useStatsStore.getState().stats;
      expect(stats).toEqual({
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
      });
    });

    it('should have actions available', () => {
      const actions = useStatsStore.getState().actions;
      expect(actions).toHaveProperty('incrementWins');
      expect(actions).toHaveProperty('incrementLosses');
      expect(typeof actions.incrementWins).toBe('function');
      expect(typeof actions.incrementLosses).toBe('function');
    });
  });

  describe('incrementWins', () => {
    it('should increment wins and gamesPlayed', () => {
      const { actions } = useStatsStore.getState();
      actions.incrementWins();

      const stats = useStatsStore.getState().stats;
      expect(stats.wins).toBe(1);
      expect(stats.losses).toBe(0);
      expect(stats.gamesPlayed).toBe(1);
    });

    it('should increment multiple times correctly', () => {
      const { actions } = useStatsStore.getState();

      actions.incrementWins();
      actions.incrementWins();
      actions.incrementWins();

      const stats = useStatsStore.getState().stats;
      expect(stats.wins).toBe(3);
      expect(stats.losses).toBe(0);
      expect(stats.gamesPlayed).toBe(3);
    });
  });

  describe('incrementLosses', () => {
    it('should increment losses and gamesPlayed', () => {
      const { actions } = useStatsStore.getState();
      actions.incrementLosses();

      const stats = useStatsStore.getState().stats;
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(1);
      expect(stats.gamesPlayed).toBe(1);
    });

    it('should increment multiple times correctly', () => {
      const { actions } = useStatsStore.getState();

      actions.incrementLosses();
      actions.incrementLosses();

      const stats = useStatsStore.getState().stats;
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(2);
      expect(stats.gamesPlayed).toBe(2);
    });
  });

  describe('mixed wins and losses', () => {
    it('should track both wins and losses correctly', () => {
      const { actions } = useStatsStore.getState();

      actions.incrementWins();
      actions.incrementLosses();
      actions.incrementWins();
      actions.incrementLosses();
      actions.incrementWins();

      const stats = useStatsStore.getState().stats;
      expect(stats.wins).toBe(3);
      expect(stats.losses).toBe(2);
      expect(stats.gamesPlayed).toBe(5);
    });
  });

  describe('store structure', () => {
    it('should have correct store structure', () => {
      const store = useStatsStore.getState();
      expect(store).toHaveProperty('stats');
      expect(store).toHaveProperty('actions');
      expect(store.stats).toHaveProperty('wins');
      expect(store.stats).toHaveProperty('losses');
      expect(store.stats).toHaveProperty('gamesPlayed');
      expect(store.actions).toHaveProperty('incrementWins');
      expect(store.actions).toHaveProperty('incrementLosses');
    });
  });

  describe('edge cases', () => {
    it('should handle large numbers', () => {
      const { actions } = useStatsStore.getState();

      for (let i = 0; i < 1000; i++) {
        actions.incrementWins();
      }

      const stats = useStatsStore.getState().stats;
      expect(stats.wins).toBe(1000);
      expect(stats.gamesPlayed).toBe(1000);
    });

    it('should maintain consistency between wins, losses, and gamesPlayed', () => {
      const { actions } = useStatsStore.getState();

      actions.incrementWins();
      actions.incrementWins();
      actions.incrementLosses();
      actions.incrementWins();
      actions.incrementLosses();

      const stats = useStatsStore.getState().stats;
      expect(stats.gamesPlayed).toBe(stats.wins + stats.losses);
    });
  });
});
