import { describe, expect, it } from 'vitest';
import {
  getAISource,
  getModeConfiguration,
  isAITurn,
  parseOpponentMode,
  parseWatchMatchup,
} from '../game-mode';

describe('game mode policy', () => {
  it('derives both AI assignments from the selected mode', () => {
    expect(getModeConfiguration('classic')).toMatchObject({
      player1: null,
      player2: 'classic',
      participants: ['human', 'classic'],
      watch: false,
    });
    expect(getModeConfiguration('watch')).toMatchObject({
      player1: 'oracle',
      player2: 'classic',
      participants: ['oracle', 'classic'],
      watch: true,
    });
    expect(getModeConfiguration('watch', { player1: 'ml', player2: 'oracle' })).toMatchObject({
      player1: 'ml',
      player2: 'oracle',
      participants: ['ml', 'oracle'],
      watch: true,
    });
    expect(getModeConfiguration('oracle')).toMatchObject({
      player1: null,
      player2: 'oracle',
      participants: ['human', 'oracle'],
      watch: false,
    });
  });

  it('identifies AI-controlled turns without duplicating mode conditionals', () => {
    expect(isAITurn('ml', 'player1')).toBe(false);
    expect(isAITurn('ml', 'player2')).toBe(true);
    expect(isAITurn('watch', 'player1')).toBe(true);
    expect(getAISource('watch', 'player2', { player1: 'classic', player2: 'oracle' })).toBe(
      'oracle'
    );
    expect(getAISource('heuristic', 'player2')).toBe('heuristic');
    expect(getAISource('oracle', 'player2')).toBe('oracle');
  });

  it('rejects invalid persisted modes', () => {
    expect(parseOpponentMode('classic')).toBe('classic');
    expect(parseOpponentMode('oracle')).toBe('oracle');
    expect(parseOpponentMode('server')).toBeNull();
    expect(parseOpponentMode({ mode: 'watch' })).toBeNull();
    expect(parseWatchMatchup({ player1: 'ml', player2: 'oracle' })).toEqual({
      player1: 'ml',
      player2: 'oracle',
    });
    expect(parseWatchMatchup({ player1: 'heuristic', player2: 'oracle' })).toBeNull();
  });
});
