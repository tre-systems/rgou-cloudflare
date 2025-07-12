import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStats } from './types';

type StatsStore = {
  stats: GameStats;
  actions: {
    incrementWins: () => void;
    incrementLosses: () => void;
  };
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
      },
      actions: {
        incrementWins: () => {
          const { stats } = get();
          set({
            stats: {
              ...stats,
              wins: stats.wins + 1,
              gamesPlayed: stats.gamesPlayed + 1,
            },
          });
        },
        incrementLosses: () => {
          const { stats } = get();
          set({
            stats: {
              ...stats,
              losses: stats.losses + 1,
              gamesPlayed: stats.gamesPlayed + 1,
            },
          });
        },
      },
    }),
    {
      name: 'rgou-stats-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ stats: state.stats }),
    }
  )
);

export const useGameStats = () => useStatsStore(state => state.stats);
export const useStatsActions = () => useStatsStore(state => state.actions);
