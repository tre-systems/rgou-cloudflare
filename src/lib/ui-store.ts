import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { parseOpponentMode } from './game-mode';
import { getBrowserStorage } from './persist-storage';
import type { OpponentMode } from './types';

type UIStore = {
  showModelOverlay: boolean;
  selectedMode: OpponentMode | null;
  soundEnabled: boolean;
  diagnosticsPanelOpen: boolean;
  howToPlayOpen: boolean;
  actions: {
    setShowModelOverlay: (show: boolean) => void;
    setSelectedMode: (mode: OpponentMode | null) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setDiagnosticsPanelOpen: (open: boolean) => void;
    setHowToPlayOpen: (open: boolean) => void;
    reset: () => void;
  };
};

export const useUIStore = create<UIStore>()(
  persist(
    set => ({
      showModelOverlay: true,
      selectedMode: null,
      soundEnabled: true,
      diagnosticsPanelOpen: false,
      howToPlayOpen: false,
      actions: {
        setShowModelOverlay: show => set({ showModelOverlay: show }),
        setSelectedMode: mode => set({ selectedMode: mode }),
        setSoundEnabled: enabled => set({ soundEnabled: enabled }),
        setDiagnosticsPanelOpen: open => set({ diagnosticsPanelOpen: open }),
        setHowToPlayOpen: open => set({ howToPlayOpen: open }),
        reset: () =>
          set({
            showModelOverlay: true,
            selectedMode: null,
            soundEnabled: true,
            diagnosticsPanelOpen: false,
            howToPlayOpen: false,
          }),
      },
    }),
    {
      name: 'rgou-ui-storage',
      storage: createJSONStorage(getBrowserStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UIStore>;
        const selectedMode = parseOpponentMode(persisted?.selectedMode);
        return {
          ...currentState,
          selectedMode,
          showModelOverlay: selectedMode === null,
          soundEnabled:
            typeof persisted?.soundEnabled === 'boolean'
              ? persisted.soundEnabled
              : currentState.soundEnabled,
        };
      },
      partialize: state => ({
        selectedMode: state.selectedMode,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

export const useUIState = () =>
  useUIStore(state => ({
    showModelOverlay: state.showModelOverlay,
    selectedMode: state.selectedMode,
    soundEnabled: state.soundEnabled,
    diagnosticsPanelOpen: state.diagnosticsPanelOpen,
    howToPlayOpen: state.howToPlayOpen,
  }));
