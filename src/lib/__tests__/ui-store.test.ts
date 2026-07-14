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
      actions.setSoundEnabled(false);
      actions.setDiagnosticsPanelOpen(true);
      actions.setHowToPlayOpen(true);

      const stateBeforeReset = useUIStore.getState();
      expect(stateBeforeReset.showModelOverlay).toBe(false);
      expect(stateBeforeReset.selectedMode).toBe('classic');
      expect(stateBeforeReset.soundEnabled).toBe(false);
      expect(stateBeforeReset.diagnosticsPanelOpen).toBe(true);
      expect(stateBeforeReset.howToPlayOpen).toBe(true);

      actions.reset();

      const stateAfterReset = useUIStore.getState();
      expect(stateAfterReset.showModelOverlay).toBe(true);
      expect(stateAfterReset.selectedMode).toBe(null);
      expect(stateAfterReset.soundEnabled).toBe(true);
      expect(stateAfterReset.diagnosticsPanelOpen).toBe(false);
      expect(stateAfterReset.howToPlayOpen).toBe(false);
    });
  });

  describe('useUIState hook', () => {
    it('should return correct state values', () => {
      const { setSelectedMode } = useUIStore.getState().actions;

      setSelectedMode('ml');

      const state = useUIStore.getState();
      const selectedState = {
        showModelOverlay: state.showModelOverlay,
        selectedMode: state.selectedMode,
        soundEnabled: state.soundEnabled,
        diagnosticsPanelOpen: state.diagnosticsPanelOpen,
        howToPlayOpen: state.howToPlayOpen,
      };

      expect(selectedState.showModelOverlay).toBe(true);
      expect(selectedState.selectedMode).toBe('ml');
      expect(selectedState.soundEnabled).toBe(true);
      expect(selectedState.diagnosticsPanelOpen).toBe(false);
      expect(selectedState.howToPlayOpen).toBe(false);
    });

    it('should not include actions in returned state', () => {
      const state = useUIStore.getState();
      const selectedState = {
        showModelOverlay: state.showModelOverlay,
        selectedMode: state.selectedMode,
        soundEnabled: state.soundEnabled,
        diagnosticsPanelOpen: state.diagnosticsPanelOpen,
        howToPlayOpen: state.howToPlayOpen,
      };

      expect(selectedState).not.toHaveProperty('actions');
      expect(selectedState).toHaveProperty('showModelOverlay');
      expect(selectedState).toHaveProperty('selectedMode');
      expect(selectedState).toHaveProperty('soundEnabled');
      expect(selectedState).toHaveProperty('diagnosticsPanelOpen');
      expect(selectedState).toHaveProperty('howToPlayOpen');
    });
  });

  describe('state persistence', () => {
    it('should maintain state across multiple actions', () => {
      const { actions } = useUIStore.getState();

      actions.setSelectedMode('classic');
      actions.setSoundEnabled(false);
      actions.setDiagnosticsPanelOpen(true);

      const state = useUIStore.getState();
      expect(state.selectedMode).toBe('classic');
      expect(state.soundEnabled).toBe(false);
      expect(state.diagnosticsPanelOpen).toBe(true);
      expect(state.showModelOverlay).toBe(true);
      expect(state.howToPlayOpen).toBe(false);
    });
  });
});
