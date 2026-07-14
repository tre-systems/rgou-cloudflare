import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameStats } from './schemas';
import { getBrowserStorage, parsePersistedGameStats } from './persist-storage';

type StatsStore = {
  stats: GameStats;
  actions: {
    incrementWins: () => void;
    incrementLosses: () => void;
  };
};

export const useStatsStore = create<StatsStore>()(
  persist(
    set => ({
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
      },
      actions: {
        incrementWins: () => {
          set(state => ({
            stats: {
              ...state.stats,
              wins: state.stats.wins + 1,
              gamesPlayed: state.stats.gamesPlayed + 1,
            },
          }));
        },
        incrementLosses: () => {
          set(state => ({
            stats: {
              ...state.stats,
              losses: state.stats.losses + 1,
              gamesPlayed: state.stats.gamesPlayed + 1,
            },
          }));
        },
      },
    }),
    {
      name: 'rgou-stats-storage',
      storage: createJSONStorage(getBrowserStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<StatsStore>;
        return {
          ...currentState,
          stats: parsePersistedGameStats(persisted?.stats) ?? currentState.stats,
        };
      },
      partialize: state => ({ stats: state.stats }),
    }
  )
);

export const useGameStats = () => useStatsStore(state => state.stats);
