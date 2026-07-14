import { describe, expect, it } from 'vitest';
import fixtures from '../../../test-fixtures/rules-conformance.json';
import { getValidMoves, materializeGameState } from '../game-logic';
import { PlayerSchema } from '../schemas';

describe('shared game-rule conformance fixtures', () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const currentPlayer = PlayerSchema.parse(fixture.currentPlayer);
      const gameState = materializeGameState({
        player1Pieces: fixture.player1Squares.map(square => ({ square, player: 'player1' })),
        player2Pieces: fixture.player2Squares.map(square => ({ square, player: 'player2' })),
        currentPlayer,
        diceRoll: fixture.diceRoll,
        history: [],
      });

      expect(getValidMoves(gameState)).toEqual(fixture.validMoves);
    });
  }
});
