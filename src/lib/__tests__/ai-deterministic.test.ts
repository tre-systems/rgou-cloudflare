import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeGame, processDiceRoll } from '../game-logic';
import { wasmAiService } from '../wasm-ai-service';

// Mock the WASM AI service to avoid actual WASM loading in tests
vi.mock('../wasm-ai-service', () => ({
  wasmAiService: {
    getAIMove: vi.fn(),
  },
}));

describe('AI Deterministic Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Winning Move Detection', () => {
    it('should choose winning move when available', async () => {
      const game = initializeGame();

      // Set up a scenario where AI can win in one move
      for (let i = 0; i < 6; i++) {
        game.player2Pieces[i].square = 20;
      }
      game.player2Pieces[6].square = 15;
      game.board[15] = game.player2Pieces[6];
      game.currentPlayer = 'player2';

      const newState = processDiceRoll(game, 1);

      // Mock AI to return the winning move
      const mockAiResponse = {
        move: 6,
        evaluation: 10000,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [6],
          searchDepth: 1,
          moveEvaluations: [],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      const result = await wasmAiService.getAIMove(newState);

      expect(result.move).toBe(6);
      expect(result.evaluation).toBe(10000);
    });

    it('should avoid losing moves when possible', async () => {
      const game = initializeGame();

      // Set up a scenario where AI has multiple moves but one leads to immediate loss
      game.player2Pieces[0].square = 4;
      game.board[4] = game.player2Pieces[0];
      game.player2Pieces[1].square = 6;
      game.board[6] = game.player2Pieces[1];
      game.currentPlayer = 'player2';

      const newState = processDiceRoll(game, 2);

      // Mock AI to avoid the losing move
      const mockAiResponse = {
        move: 1, // Choose piece 1 instead of piece 0 which would be captured
        evaluation: -500,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [0, 1],
          searchDepth: 1,
          moveEvaluations: [],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      const result = await wasmAiService.getAIMove(newState);

      expect(result.move).toBe(1);
      expect(result.evaluation).toBeLessThan(0);
    });
  });

  describe('Rosette Strategy', () => {
    it('should prefer rosette moves when available', async () => {
      const game = initializeGame();

      // Set up scenario where AI can move to a rosette
      game.player2Pieces[0].square = 5;
      game.board[5] = game.player2Pieces[0];
      game.currentPlayer = 'player2';

      const newState = processDiceRoll(game, 2);

      const mockAiResponse = {
        move: 0,
        evaluation: 100,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [0, 1],
          searchDepth: 1,
          moveEvaluations: [
            { pieceIndex: 0, score: 100, moveType: 'rosette', fromSquare: 5, toSquare: 7 },
            { pieceIndex: 1, score: 50, moveType: 'normal_move', fromSquare: -1, toSquare: null },
          ],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      const result = await wasmAiService.getAIMove(newState);

      expect(result.move).toBe(0);
      expect(result.diagnostics.moveEvaluations[0].moveType).toBe('rosette');
    });
  });

  describe('Capture Strategy', () => {
    it('should prefer capture moves when beneficial', async () => {
      const game = initializeGame();

      // Set up scenario where AI can capture opponent piece
      game.player2Pieces[0].square = 4;
      game.board[4] = game.player2Pieces[0];
      game.player1Pieces[0].square = 6;
      game.board[6] = game.player1Pieces[0];
      game.currentPlayer = 'player2';

      const newState = processDiceRoll(game, 2);

      const mockAiResponse = {
        move: 0,
        evaluation: 200,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [0, 1],
          searchDepth: 1,
          moveEvaluations: [
            { pieceIndex: 0, score: 200, moveType: 'capture', fromSquare: 4, toSquare: 6 },
            { pieceIndex: 1, score: 50, moveType: 'normal_move', fromSquare: -1, toSquare: null },
          ],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      const result = await wasmAiService.getAIMove(newState);

      expect(result.move).toBe(0);
      expect(result.diagnostics.moveEvaluations[0].moveType).toBe('capture');
    });
  });

  describe('Opening Strategy', () => {
    it('should prefer moving pieces from start in opening', async () => {
      const game = initializeGame();
      game.currentPlayer = 'player2';

      const newState = processDiceRoll(game, 4);

      const mockAiResponse = {
        move: 0,
        evaluation: 75,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [0, 1],
          searchDepth: 1,
          moveEvaluations: [
            { pieceIndex: 0, score: 75, moveType: 'opening_move', fromSquare: -1, toSquare: 4 },
            { pieceIndex: 1, score: 75, moveType: 'opening_move', fromSquare: -1, toSquare: 4 },
          ],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      const result = await wasmAiService.getAIMove(newState);

      expect(result.move).toBe(0);
      expect(result.evaluation).toBeGreaterThan(0);
    });
  });

  describe('Endgame Strategy', () => {
    it('should prioritize finishing pieces in endgame', async () => {
      const game = initializeGame();

      // Set up endgame scenario
      for (let i = 0; i < 5; i++) {
        game.player2Pieces[i].square = 20;
      }
      game.player2Pieces[5].square = 13;
      game.board[13] = game.player2Pieces[5];
      game.player2Pieces[6].square = 15;
      game.board[15] = game.player2Pieces[6];
      game.currentPlayer = 'player2';

      const newState = processDiceRoll(game, 1);

      const mockAiResponse = {
        move: 5, // Choose piece closer to finish
        evaluation: 500,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [5, 6],
          searchDepth: 1,
          moveEvaluations: [
            { pieceIndex: 5, score: 500, moveType: 'finish_move', fromSquare: 13, toSquare: 20 },
            { pieceIndex: 6, score: 300, moveType: 'advance', fromSquare: 15, toSquare: 16 },
          ],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      const result = await wasmAiService.getAIMove(newState);

      expect(result.move).toBe(5);
      expect(result.diagnostics.moveEvaluations[0].moveType).toBe('finish_move');
    });
  });
});
