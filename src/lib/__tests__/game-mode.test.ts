import { describe, expect, it } from 'vitest';
import { getAISource, getModeConfiguration, isAITurn, parseOpponentMode } from '../game-mode';

describe('game mode policy', () => {
  it('derives both AI assignments from the selected mode', () => {
    expect(getModeConfiguration('classic')).toMatchObject({
      player1: null,
      player2: 'classic',
      participants: ['human', 'classic'],
      watch: false,
    });
    expect(getModeConfiguration('watch')).toMatchObject({
      player1: 'classic',
      player2: 'ml',
      participants: ['classic', 'ml'],
      watch: true,
    });
  });

  it('identifies AI-controlled turns without duplicating mode conditionals', () => {
    expect(isAITurn('ml', 'player1')).toBe(false);
    expect(isAITurn('ml', 'player2')).toBe(true);
    expect(isAITurn('watch', 'player1')).toBe(true);
    expect(getAISource('heuristic', 'player2')).toBe('heuristic');
  });

  it('rejects invalid persisted modes', () => {
    expect(parseOpponentMode('classic')).toBe('classic');
    expect(parseOpponentMode('server')).toBeNull();
    expect(parseOpponentMode({ mode: 'watch' })).toBeNull();
  });
});
