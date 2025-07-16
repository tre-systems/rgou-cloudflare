import { describe, it, expect } from 'vitest';
import {
  ROSETTE_SQUARES,
  TRACK_LENGTH,
  PIECES_PER_PLAYER,
  PLAYER1_TRACK,
  PLAYER2_TRACK,
  GameConstants,
} from '../types';

describe('types', () => {
  describe('constants', () => {
    it('should export ROSETTE_SQUARES constant', () => {
      expect(ROSETTE_SQUARES).toBeDefined();
      expect(Array.isArray(ROSETTE_SQUARES)).toBe(true);
      expect(ROSETTE_SQUARES).toEqual([0, 7, 13, 15, 16]);
    });

    it('should export TRACK_LENGTH constant', () => {
      expect(TRACK_LENGTH).toBeDefined();
      expect(typeof TRACK_LENGTH).toBe('number');
      expect(TRACK_LENGTH).toBe(20);
    });

    it('should export PIECES_PER_PLAYER constant', () => {
      expect(PIECES_PER_PLAYER).toBeDefined();
      expect(typeof PIECES_PER_PLAYER).toBe('number');
      expect(PIECES_PER_PLAYER).toBe(7);
    });

    it('should export PLAYER1_TRACK constant', () => {
      expect(PLAYER1_TRACK).toBeDefined();
      expect(Array.isArray(PLAYER1_TRACK)).toBe(true);
      expect(PLAYER1_TRACK).toHaveLength(14);
    });

    it('should export PLAYER2_TRACK constant', () => {
      expect(PLAYER2_TRACK).toBeDefined();
      expect(Array.isArray(PLAYER2_TRACK)).toBe(true);
      expect(PLAYER2_TRACK).toHaveLength(14);
    });

    it('should export GameConstants object', () => {
      expect(GameConstants).toBeDefined();
      expect(typeof GameConstants).toBe('object');
      expect(GameConstants.ROSETTE_SQUARES).toEqual([0, 7, 13, 15, 16]);
      expect(GameConstants.TRACK_LENGTH).toBe(20);
      expect(GameConstants.PIECES_PER_PLAYER).toBe(7);
    });

    it('should have consistent values between direct exports and GameConstants', () => {
      expect(ROSETTE_SQUARES).toBe(GameConstants.ROSETTE_SQUARES);
      expect(TRACK_LENGTH).toBe(GameConstants.TRACK_LENGTH);
      expect(PIECES_PER_PLAYER).toBe(GameConstants.PIECES_PER_PLAYER);
      expect(PLAYER1_TRACK).toBe(GameConstants.PLAYER1_TRACK);
      expect(PLAYER2_TRACK).toBe(GameConstants.PLAYER2_TRACK);
    });
  });

  describe('track validation', () => {
    it('should have valid player1 track indices', () => {
      PLAYER1_TRACK.forEach(square => {
        expect(square).toBeGreaterThanOrEqual(-1);
        expect(square).toBeLessThanOrEqual(20);
      });
    });

    it('should have valid player2 track indices', () => {
      PLAYER2_TRACK.forEach(square => {
        expect(square).toBeGreaterThanOrEqual(-1);
        expect(square).toBeLessThanOrEqual(20);
      });
    });

    it('should have rosette squares in valid positions', () => {
      ROSETTE_SQUARES.forEach(square => {
        expect(square).toBeGreaterThanOrEqual(0);
        expect(square).toBeLessThanOrEqual(20);
      });
    });
  });
});
