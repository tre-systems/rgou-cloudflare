import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getBrowserStorage } from './persist-storage';

type UIStore = {
  showModelOverlay: boolean;
  selectedMode: 'heuristic' | 'classic' | 'ml' | 'watch' | null;
  aiSourceP1: 'heuristic' | 'client' | 'ml' | null;
  aiSourceP2: 'heuristic' | 'client' | 'ml';
  soundEnabled: boolean;
  diagnosticsPanelOpen: boolean;
  howToPlayOpen: boolean;
  actions: {
    setShowModelOverlay: (show: boolean) => void;
    setSelectedMode: (mode: 'heuristic' | 'classic' | 'ml' | 'watch' | null) => void;
    setAiSourceP1: (source: 'heuristic' | 'client' | 'ml' | null) => void;
    setAiSourceP2: (source: 'heuristic' | 'client' | 'ml') => void;
    setSoundEnabled: (enabled: boolean) => void;
    setDiagnosticsPanelOpen: (open: boolean) => void;
    setHowToPlayOpen: (open: boolean) => void;
    reset: () => void;
  };
};

function restoreMode(value: unknown): Pick<UIStore, 'selectedMode' | 'aiSourceP1' | 'aiSourceP2'> {
  switch (value) {
    case 'heuristic':
      return { selectedMode: value, aiSourceP1: null, aiSourceP2: 'heuristic' };
    case 'classic':
      return { selectedMode: value, aiSourceP1: null, aiSourceP2: 'client' };
    case 'ml':
      return { selectedMode: value, aiSourceP1: null, aiSourceP2: 'ml' };
    case 'watch':
      return { selectedMode: value, aiSourceP1: 'client', aiSourceP2: 'ml' };
    default:
      return { selectedMode: null, aiSourceP1: null, aiSourceP2: 'ml' };
  }
}

export const useUIStore = create<UIStore>()(
  persist(
    set => ({
      showModelOverlay: true,
      selectedMode: null,
      aiSourceP1: null,
      aiSourceP2: 'ml',
      soundEnabled: true,
      diagnosticsPanelOpen: false,
      howToPlayOpen: false,
      actions: {
        setShowModelOverlay: show => set({ showModelOverlay: show }),
        setSelectedMode: mode => set({ selectedMode: mode }),
        setAiSourceP1: source => set({ aiSourceP1: source }),
        setAiSourceP2: source => set({ aiSourceP2: source }),
        setSoundEnabled: enabled => set({ soundEnabled: enabled }),
        setDiagnosticsPanelOpen: open => set({ diagnosticsPanelOpen: open }),
        setHowToPlayOpen: open => set({ howToPlayOpen: open }),
        reset: () =>
          set({
            showModelOverlay: true,
            selectedMode: null,
            aiSourceP1: null,
            aiSourceP2: 'ml',
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
        const mode = restoreMode(persisted?.selectedMode);
        return {
          ...currentState,
          ...mode,
          showModelOverlay: mode.selectedMode === null,
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
    aiSourceP1: state.aiSourceP1,
    aiSourceP2: state.aiSourceP2,
    soundEnabled: state.soundEnabled,
    diagnosticsPanelOpen: state.diagnosticsPanelOpen,
    howToPlayOpen: state.howToPlayOpen,
  }));
