import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '../ui-store';

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.getState().actions.reset();
  });

  it('starts with the model chooser and sound enabled', () => {
    const state = useUIStore.getState();

    expect(state).toMatchObject({
      showModelOverlay: true,
      selectedMode: null,
      watchMatchup: { player1: 'oracle', player2: 'classic' },
      soundEnabled: true,
      diagnosticsPanelOpen: false,
      howToPlayOpen: false,
    });
  });

  it('updates each UI preference', () => {
    const actions = useUIStore.getState().actions;

    actions.setShowModelOverlay(false);
    actions.setSelectedMode('classic');
    actions.setWatchMatchup({ player1: 'ml', player2: 'oracle' });
    actions.setSoundEnabled(false);
    actions.setDiagnosticsPanelOpen(true);
    actions.setHowToPlayOpen(true);

    expect(useUIStore.getState()).toMatchObject({
      showModelOverlay: false,
      selectedMode: 'classic',
      watchMatchup: { player1: 'ml', player2: 'oracle' },
      soundEnabled: false,
      diagnosticsPanelOpen: true,
      howToPlayOpen: true,
    });
  });

  it('resets every preference', () => {
    const actions = useUIStore.getState().actions;
    actions.setShowModelOverlay(false);
    actions.setSelectedMode('ml');
    actions.setWatchMatchup({ player1: 'classic', player2: 'ml' });
    actions.setSoundEnabled(false);
    actions.setDiagnosticsPanelOpen(true);
    actions.setHowToPlayOpen(true);

    actions.reset();

    expect(useUIStore.getState()).toMatchObject({
      showModelOverlay: true,
      selectedMode: null,
      watchMatchup: { player1: 'oracle', player2: 'classic' },
      soundEnabled: true,
      diagnosticsPanelOpen: false,
      howToPlayOpen: false,
    });
  });
});
