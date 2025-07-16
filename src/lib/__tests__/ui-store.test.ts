import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui-store';

describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.getState().actions.reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();

      expect(state.showModelOverlay).toBe(true);
      expect(state.selectedMode).toBe(null);
      expect(state.aiSourceP1).toBe(null);
      expect(state.aiSourceP2).toBe('ml');
      expect(state.soundEnabled).toBe(true);
      expect(state.diagnosticsPanelOpen).toBe(false);
      expect(state.howToPlayOpen).toBe(false);
    });
  });

  describe('setShowModelOverlay', () => {
    it('should update showModelOverlay state', () => {
      const { setShowModelOverlay } = useUIStore.getState().actions;

      setShowModelOverlay(false);
      expect(useUIStore.getState().showModelOverlay).toBe(false);

      setShowModelOverlay(true);
      expect(useUIStore.getState().showModelOverlay).toBe(true);
    });
  });

  describe('setSelectedMode', () => {
    it('should update selectedMode state', () => {
      const { setSelectedMode } = useUIStore.getState().actions;

      setSelectedMode('classic');
      expect(useUIStore.getState().selectedMode).toBe('classic');

      setSelectedMode('ml');
      expect(useUIStore.getState().selectedMode).toBe('ml');

      setSelectedMode('watch');
      expect(useUIStore.getState().selectedMode).toBe('watch');

      setSelectedMode(null);
      expect(useUIStore.getState().selectedMode).toBe(null);
    });
  });

  describe('setAiSourceP1', () => {
    it('should update aiSourceP1 state', () => {
      const { setAiSourceP1 } = useUIStore.getState().actions;

      setAiSourceP1('client');
      expect(useUIStore.getState().aiSourceP1).toBe('client');

      setAiSourceP1('ml');
      expect(useUIStore.getState().aiSourceP1).toBe('ml');

      setAiSourceP1(null);
      expect(useUIStore.getState().aiSourceP1).toBe(null);
    });
  });

  describe('setAiSourceP2', () => {
    it('should update aiSourceP2 state', () => {
      const { setAiSourceP2 } = useUIStore.getState().actions;

      setAiSourceP2('client');
      expect(useUIStore.getState().aiSourceP2).toBe('client');

      setAiSourceP2('ml');
      expect(useUIStore.getState().aiSourceP2).toBe('ml');
    });
  });

  describe('setSoundEnabled', () => {
    it('should update soundEnabled state', () => {
      const { setSoundEnabled } = useUIStore.getState().actions;

      setSoundEnabled(false);
      expect(useUIStore.getState().soundEnabled).toBe(false);

      setSoundEnabled(true);
      expect(useUIStore.getState().soundEnabled).toBe(true);
    });
  });

  describe('setDiagnosticsPanelOpen', () => {
    it('should update diagnosticsPanelOpen state', () => {
      const { setDiagnosticsPanelOpen } = useUIStore.getState().actions;

      setDiagnosticsPanelOpen(true);
      expect(useUIStore.getState().diagnosticsPanelOpen).toBe(true);

      setDiagnosticsPanelOpen(false);
      expect(useUIStore.getState().diagnosticsPanelOpen).toBe(false);
    });
  });

  describe('setHowToPlayOpen', () => {
    it('should update howToPlayOpen state', () => {
      const { setHowToPlayOpen } = useUIStore.getState().actions;

      setHowToPlayOpen(true);
      expect(useUIStore.getState().howToPlayOpen).toBe(true);

      setHowToPlayOpen(false);
      expect(useUIStore.getState().howToPlayOpen).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { actions } = useUIStore.getState();

      actions.setShowModelOverlay(false);
      actions.setSelectedMode('classic');
      actions.setAiSourceP1('client');
      actions.setAiSourceP2('client');
      actions.setSoundEnabled(false);
      actions.setDiagnosticsPanelOpen(true);
      actions.setHowToPlayOpen(true);

      const stateBeforeReset = useUIStore.getState();
      expect(stateBeforeReset.showModelOverlay).toBe(false);
      expect(stateBeforeReset.selectedMode).toBe('classic');
      expect(stateBeforeReset.aiSourceP1).toBe('client');
      expect(stateBeforeReset.aiSourceP2).toBe('client');
      expect(stateBeforeReset.soundEnabled).toBe(false);
      expect(stateBeforeReset.diagnosticsPanelOpen).toBe(true);
      expect(stateBeforeReset.howToPlayOpen).toBe(true);

      actions.reset();

      const stateAfterReset = useUIStore.getState();
      expect(stateAfterReset.showModelOverlay).toBe(true);
      expect(stateAfterReset.selectedMode).toBe(null);
      expect(stateAfterReset.aiSourceP1).toBe(null);
      expect(stateAfterReset.aiSourceP2).toBe('ml');
      expect(stateAfterReset.soundEnabled).toBe(true);
      expect(stateAfterReset.diagnosticsPanelOpen).toBe(false);
      expect(stateAfterReset.howToPlayOpen).toBe(false);
    });
  });

  describe('useUIState hook', () => {
    it('should return correct state values', () => {
      const { setSelectedMode, setAiSourceP1 } = useUIStore.getState().actions;

      setSelectedMode('ml');
      setAiSourceP1('client');

      const state = useUIStore.getState();
      const selectedState = {
        showModelOverlay: state.showModelOverlay,
        selectedMode: state.selectedMode,
        aiSourceP1: state.aiSourceP1,
        aiSourceP2: state.aiSourceP2,
        soundEnabled: state.soundEnabled,
        diagnosticsPanelOpen: state.diagnosticsPanelOpen,
        howToPlayOpen: state.howToPlayOpen,
      };

      expect(selectedState.showModelOverlay).toBe(true);
      expect(selectedState.selectedMode).toBe('ml');
      expect(selectedState.aiSourceP1).toBe('client');
      expect(selectedState.aiSourceP2).toBe('ml');
      expect(selectedState.soundEnabled).toBe(true);
      expect(selectedState.diagnosticsPanelOpen).toBe(false);
      expect(selectedState.howToPlayOpen).toBe(false);
    });

    it('should not include actions in returned state', () => {
      const state = useUIStore.getState();
      const selectedState = {
        showModelOverlay: state.showModelOverlay,
        selectedMode: state.selectedMode,
        aiSourceP1: state.aiSourceP1,
        aiSourceP2: state.aiSourceP2,
        soundEnabled: state.soundEnabled,
        diagnosticsPanelOpen: state.diagnosticsPanelOpen,
        howToPlayOpen: state.howToPlayOpen,
      };

      expect(selectedState).not.toHaveProperty('actions');
      expect(selectedState).toHaveProperty('showModelOverlay');
      expect(selectedState).toHaveProperty('selectedMode');
      expect(selectedState).toHaveProperty('aiSourceP1');
      expect(selectedState).toHaveProperty('aiSourceP2');
      expect(selectedState).toHaveProperty('soundEnabled');
      expect(selectedState).toHaveProperty('diagnosticsPanelOpen');
      expect(selectedState).toHaveProperty('howToPlayOpen');
    });
  });

  describe('state persistence', () => {
    it('should maintain state across multiple actions', () => {
      const { actions } = useUIStore.getState();

      actions.setSelectedMode('classic');
      actions.setAiSourceP1('ml');
      actions.setSoundEnabled(false);
      actions.setDiagnosticsPanelOpen(true);

      const state = useUIStore.getState();
      expect(state.selectedMode).toBe('classic');
      expect(state.aiSourceP1).toBe('ml');
      expect(state.soundEnabled).toBe(false);
      expect(state.diagnosticsPanelOpen).toBe(true);
      expect(state.showModelOverlay).toBe(true);
      expect(state.aiSourceP2).toBe('ml');
      expect(state.howToPlayOpen).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should only accept valid mode values', () => {
      const { setSelectedMode } = useUIStore.getState().actions;

      setSelectedMode('classic');
      setSelectedMode('ml');
      setSelectedMode('watch');
      setSelectedMode(null);
    });

    it('should only accept valid AI source values', () => {
      const { setAiSourceP1, setAiSourceP2 } = useUIStore.getState().actions;

      setAiSourceP1('client');
      setAiSourceP1('ml');
      setAiSourceP1(null);

      setAiSourceP2('client');
      setAiSourceP2('ml');
    });
  });
});
