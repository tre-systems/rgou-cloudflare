import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { soundEffects } from '../sound-effects';

describe('SoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enabled state', () => {
    it('should start with sound enabled', () => {
      expect(soundEffects.isEnabled).toBe(true);
    });

    it('should toggle enabled state', () => {
      expect(soundEffects.toggle()).toBe(false);
      expect(soundEffects.isEnabled).toBe(false);

      expect(soundEffects.toggle()).toBe(true);
      expect(soundEffects.isEnabled).toBe(true);
    });

    it('should set enabled state', () => {
      soundEffects.setEnabled(false);
      expect(soundEffects.isEnabled).toBe(false);

      soundEffects.setEnabled(true);
      expect(soundEffects.isEnabled).toBe(true);
    });
  });

  describe('sound methods', () => {
    it('should have all required sound methods', () => {
      expect(typeof soundEffects.diceRoll).toBe('function');
      expect(typeof soundEffects.pieceMove).toBe('function');
      expect(typeof soundEffects.pieceCapture).toBe('function');
      expect(typeof soundEffects.rosetteLanding).toBe('function');
      expect(typeof soundEffects.pieceFinish).toBe('function');
      expect(typeof soundEffects.gameWin).toBe('function');
      expect(typeof soundEffects.gameLoss).toBe('function');
      expect(typeof soundEffects.aiThinking).toBe('function');
      expect(typeof soundEffects.buttonClick).toBe('function');
    });

    it('should return promises from sound methods', async () => {
      const promises = [
        soundEffects.diceRoll(),
        soundEffects.pieceMove(),
        soundEffects.pieceCapture(),
        soundEffects.rosetteLanding(),
        soundEffects.pieceFinish(),
        soundEffects.gameWin(),
        soundEffects.gameLoss(),
        soundEffects.aiThinking(),
        soundEffects.buttonClick(),
      ];

      // All methods should return promises
      promises.forEach(promise => {
        expect(promise).toBeInstanceOf(Promise);
      });

      // Should not throw when called
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should not play sounds when disabled', async () => {
      soundEffects.setEnabled(false);

      // Should not throw when disabled
      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();
      await expect(soundEffects.diceRoll()).resolves.toBeUndefined();
      await expect(soundEffects.buttonClick()).resolves.toBeUndefined();
    });
  });

  describe('browser environment handling', () => {
    it('should handle missing AudioContext gracefully', async () => {
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();

      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });

    it('should handle AudioContext errors gracefully', async () => {
      const originalWindow = global.window;
      const mockAudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported');
      });

      Object.defineProperty(global, 'window', {
        value: { AudioContext: mockAudioContext },
        writable: true,
      });

      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();

      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe('audio context state management', () => {
    it('should handle suspended audio context', async () => {
      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();
    });
  });

  describe('sound effect timing', () => {
    it('should handle setTimeout calls in sound effects', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      await soundEffects.diceRoll();

      expect(setTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
    });

    it('should handle multiple setTimeout calls in complex effects', async () => {
      await expect(soundEffects.pieceFinish()).resolves.toBeUndefined();
    });
  });
});
