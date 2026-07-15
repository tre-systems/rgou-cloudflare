import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_WATCH_MATCHUP, parseOpponentMode, parseWatchMatchup } from './game-mode';
import { getBrowserStorage } from './persist-storage';
import type { OpponentMode, WatchMatchup } from './types';

type UIStore = {
  showModelOverlay: boolean;
  selectedMode: OpponentMode | null;
  watchMatchup: WatchMatchup;
  soundEnabled: boolean;
  diagnosticsPanelOpen: boolean;
  howToPlayOpen: boolean;
  actions: {
    setShowModelOverlay: (show: boolean) => void;
    setSelectedMode: (mode: OpponentMode | null) => void;
    setWatchMatchup: (matchup: WatchMatchup) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setDiagnosticsPanelOpen: (open: boolean) => void;
    setHowToPlayOpen: (open: boolean) => void;
    reset: () => void;
  };
};

const INITIAL_UI_STATE = {
  showModelOverlay: true,
  selectedMode: null,
  watchMatchup: DEFAULT_WATCH_MATCHUP,
  soundEnabled: true,
  diagnosticsPanelOpen: false,
  howToPlayOpen: false,
} satisfies Omit<UIStore, 'actions'>;

export const useUIStore = create<UIStore>()(
  persist(
    set => ({
      ...INITIAL_UI_STATE,
      actions: {
        setShowModelOverlay: show => set({ showModelOverlay: show }),
        setSelectedMode: mode => set({ selectedMode: mode }),
        setWatchMatchup: matchup => set({ watchMatchup: matchup }),
        setSoundEnabled: enabled => set({ soundEnabled: enabled }),
        setDiagnosticsPanelOpen: open => set({ diagnosticsPanelOpen: open }),
        setHowToPlayOpen: open => set({ howToPlayOpen: open }),
        reset: () => set(INITIAL_UI_STATE),
      },
    }),
    {
      name: 'rgou-ui-storage',
      storage: createJSONStorage(getBrowserStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UIStore>;
        const selectedMode = parseOpponentMode(persisted?.selectedMode);
        const watchMatchup = parseWatchMatchup(persisted?.watchMatchup) ?? DEFAULT_WATCH_MATCHUP;
        return {
          ...currentState,
          selectedMode,
          watchMatchup,
          showModelOverlay: selectedMode === null,
          soundEnabled:
            typeof persisted?.soundEnabled === 'boolean'
              ? persisted.soundEnabled
              : currentState.soundEnabled,
        };
      },
      partialize: state => ({
        selectedMode: state.selectedMode,
        watchMatchup: state.watchMatchup,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

export const useUIState = () =>
  useUIStore(state => ({
    showModelOverlay: state.showModelOverlay,
    selectedMode: state.selectedMode,
    watchMatchup: state.watchMatchup,
    soundEnabled: state.soundEnabled,
    diagnosticsPanelOpen: state.diagnosticsPanelOpen,
    howToPlayOpen: state.howToPlayOpen,
  }));
