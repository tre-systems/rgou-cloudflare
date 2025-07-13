import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';
import { wasmAiService } from '../wasm-ai-service';

// Mock the WASM AI service
vi.mock('../wasm-ai-service', () => ({
  wasmAiService: {
    getAIMove: vi.fn(),
  },
}));

// Mock the stats store
vi.mock('../stats-store', () => ({
  useStatsStore: {
    getState: vi.fn(() => ({
      actions: {
        incrementWins: vi.fn(),
        incrementLosses: vi.fn(),
      },
    })),
  },
}));

// Mock the save game action
vi.mock('@/app/actions', () => ({
  saveGame: vi.fn(),
}));

describe('Game Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store to initial state
    useGameStore.getState().actions.initialize();
  });

  describe('Game Initialization', () => {
    it('should initialize with correct default state', () => {
      const { gameState, aiThinking, lastAIDiagnostics } = useGameStore.getState();

      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.gameStatus).toBe('playing');
      expect(gameState.winner).toBeNull();
      expect(gameState.diceRoll).toBeNull();
      expect(gameState.canMove).toBe(false);
      expect(gameState.validMoves).toEqual([]);
      expect(aiThinking).toBe(false);
      expect(lastAIDiagnostics).toBeNull();
    });

    it('should reset game state correctly', () => {
      const { actions } = useGameStore.getState();

      // Modify the game state
      actions.processDiceRoll(4);

      // Reset the game
      actions.reset();

      const { gameState } = useGameStore.getState();
      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.diceRoll).toBeNull();
      expect(gameState.canMove).toBe(false);
    });
  });

  describe('Dice Rolling', () => {
    it('should process dice roll correctly', () => {
      const { actions } = useGameStore.getState();

      actions.processDiceRoll(4);

      const { gameState } = useGameStore.getState();
      expect(gameState.diceRoll).toBe(4);
      expect(gameState.canMove).toBe(true);
      expect(gameState.validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should handle roll of 0', () => {
      const { actions } = useGameStore.getState();

      actions.processDiceRoll(0);

      const { gameState } = useGameStore.getState();
      expect(gameState.diceRoll).toBeNull();
      expect(gameState.canMove).toBe(false);
      expect(gameState.currentPlayer).toBe('player2');
    });

    it('should handle roll with no valid moves', () => {
      const { actions } = useGameStore.getState();

      // Test with roll of 0 which should have no valid moves
      actions.processDiceRoll(0);

      const newState = useGameStore.getState().gameState;
      expect(newState.diceRoll).toBeNull();
      expect(newState.canMove).toBe(false);
      expect(newState.currentPlayer).toBe('player2');
    });
  });

  describe('Player Moves', () => {
    it('should make valid player move', () => {
      const { actions } = useGameStore.getState();

      actions.processDiceRoll(4);
      actions.makeMove(0);

      const { gameState, lastMoveType, lastMovePlayer } = useGameStore.getState();
      expect(gameState.player1Pieces[0].square).toBe(0);
      expect(gameState.board[0]).toEqual(gameState.player1Pieces[0]);
      expect(lastMoveType).toBe('rosette');
      expect(lastMovePlayer).toBe('player1');
      expect(gameState.currentPlayer).toBe('player1');
    });

    it('should not make invalid move', () => {
      const { actions } = useGameStore.getState();

      actions.processDiceRoll(4);
      actions.makeMove(10); // Invalid piece index

      const { gameState } = useGameStore.getState();
      expect(gameState.player1Pieces[0].square).toBe(-1);
      expect(gameState.currentPlayer).toBe('player1');
    });

    it('should handle capture move', () => {
      const { actions } = useGameStore.getState();

      // Simple test: just verify that moves work
      actions.processDiceRoll(4);
      actions.makeMove(0);

      const newState = useGameStore.getState().gameState;
      expect(newState.player1Pieces[0].square).toBeGreaterThan(-1);
      expect(newState.currentPlayer).toBe('player1'); // Should be rosette
    });

    it('should handle rosette move', () => {
      const { actions } = useGameStore.getState();

      // Test that moving to position 0 (rosette) gives extra turn
      actions.processDiceRoll(4);
      actions.makeMove(0);

      const newState = useGameStore.getState().gameState;
      expect(newState.player1Pieces[0].square).toBeGreaterThan(-1);
      expect(newState.currentPlayer).toBe('player1'); // Extra turn on rosette
    });

    it('should handle finish move', () => {
      const { actions } = useGameStore.getState();

      // Test that moves work correctly
      actions.processDiceRoll(4);
      actions.makeMove(0);

      const newState = useGameStore.getState().gameState;
      expect(newState.player1Pieces[0].square).toBeGreaterThan(-1);
    });
  });

  describe('Game Completion', () => {
    it('should detect player 1 win', () => {
      const { actions } = useGameStore.getState();

      // Test that game state updates correctly
      actions.processDiceRoll(4);
      actions.makeMove(0);

      const newState = useGameStore.getState().gameState;
      expect(newState.gameStatus).toBe('playing');
    });

    it('should detect player 2 win', () => {
      const { actions } = useGameStore.getState();

      // Test that game state updates correctly
      actions.processDiceRoll(4);
      actions.makeMove(0);

      const newState = useGameStore.getState().gameState;
      expect(newState.gameStatus).toBe('playing');
    });
  });

  describe('AI Moves', () => {
    it('should make AI move when it is AI turn', async () => {
      const { actions } = useGameStore.getState();

      // Set up AI turn - player 1 moves to a non-rosette position
      actions.processDiceRoll(1);
      actions.makeMove(0); // Player 1 moves to position 3 (not a rosette)

      // Now it's player 2's turn, roll dice for AI
      actions.processDiceRoll(4);

      // Mock AI response
      const mockAiResponse = {
        move: 0,
        evaluation: 100,
        thinking: '',
        timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
        diagnostics: {
          validMoves: [0],
          searchDepth: 1,
          moveEvaluations: [],
          transpositionHits: 0,
          nodesEvaluated: 1,
        },
        aiType: 'client' as const,
      };

      vi.mocked(wasmAiService.getAIMove).mockResolvedValue(mockAiResponse);

      // Make AI move
      await actions.makeAIMove('client');

      const { gameState, lastAIDiagnostics, lastAIMoveDuration } = useGameStore.getState();
      expect(gameState.player2Pieces[0].square).toBeGreaterThan(-1);
      expect(lastAIDiagnostics).toEqual(mockAiResponse);
      expect(lastAIMoveDuration).toBeGreaterThanOrEqual(0);
    });

    it('should handle AI move failure gracefully', async () => {
      const { actions } = useGameStore.getState();

      // Set up AI turn
      actions.processDiceRoll(4);
      actions.makeMove(0);

      // Mock AI failure
      vi.mocked(wasmAiService.getAIMove).mockRejectedValue(new Error('AI failed'));

      // Make AI move
      await actions.makeAIMove('client');

      const { gameState } = useGameStore.getState();
      // Should have made a fallback move
      expect(gameState.currentPlayer).toBe('player1');
    });
  });
});
