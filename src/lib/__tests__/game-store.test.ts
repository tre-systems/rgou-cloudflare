import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';
import { createTestGameState } from './test-utils';

const incrementWinsMock = vi.fn();
const incrementLossesMock = vi.fn();

vi.mock('../wasm-ai-service', () => ({
  WasmAiService: vi.fn().mockImplementation(() => ({
    getAIMove: vi.fn(),
  })),
}));

vi.mock('../ml-ai-service', () => ({
  MLAIService: vi.fn().mockImplementation(() => ({
    getAIMove: vi.fn(),
  })),
}));

vi.mock('../stats-store', () => ({
  useStatsStore: {
    getState: vi.fn(() => ({
      actions: {
        incrementWins: incrementWinsMock,
        incrementLosses: incrementLossesMock,
      },
    })),
  },
}));

vi.mock('@/lib/actions', () => ({
  saveGame: vi.fn(),
}));

describe('GameStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().actions.reset();
  });

  describe('initialize', () => {
    it('should initialize game state', () => {
      const { actions } = useGameStore.getState();
      actions.initialize(false);

      const state = useGameStore.getState();
      expect(state.aiThinking).toBe(false);
      expect(state.lastAIDiagnostics).toBe(null);
    });
  });

  describe('makeMove', () => {
    it('should not make a move if it is not allowed', () => {
      const { actions, gameState } = useGameStore.getState();
      const initialState = { ...gameState };
      actions.makeMove(0);
      expect(useGameStore.getState().gameState).toEqual(initialState);
    });

    it('should make a move and update game state', () => {
      useGameStore.setState({
        gameState: createTestGameState({
          diceRoll: 4,
          canMove: true,
          validMoves: [0],
        }),
      });

      const { actions } = useGameStore.getState();
      actions.makeMove(0);

      const { gameState, lastMoveType, lastMovePlayer } = useGameStore.getState();
      expect(gameState.player1Pieces[0].square).toBe(0);
      expect(lastMoveType).toBe('rosette');
      expect(lastMovePlayer).toBe('player1');
    });

    it('should handle game finish and increment wins for player1', () => {
      const { actions } = useGameStore.getState();
      actions.createNearWinningState(); // player1 piece 6 at square 12

      actions.processDiceRoll(2); // This will finish the piece
      actions.makeMove(6);

      const { gameState } = useGameStore.getState();
      expect(gameState.gameStatus).toBe('finished');
      expect(gameState.winner).toBe('player1');
      expect(incrementWinsMock).toHaveBeenCalled();
    });
  });

  describe('makeAIMove', () => {
    it('should not make AI move when it is not AI turn', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player1',
          canMove: true,
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('server');

      const { aiThinking } = useGameStore.getState();
      expect(aiThinking).toBe(false);
    });

    it('should handle WASM AI move successfully', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          canMove: true,
          validMoves: [0],
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('server');

      const { aiThinking } = useGameStore.getState();
      expect(aiThinking).toBe(false);
    });

    it('should handle ML AI move successfully', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          canMove: true,
          validMoves: [0],
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('ml');

      const { aiThinking } = useGameStore.getState();
      expect(aiThinking).toBe(false);
    });

    it('should use fallback when AI returns invalid move', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          canMove: true,
          validMoves: [1],
          diceRoll: 1,
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('server');

      const { gameState } = useGameStore.getState();
      // fallback is to take first valid move, which is piece 1
      expect(gameState.player2Pieces[1].square).not.toBe(-1);
    });
  });

  describe('reset', () => {
    it('should reset game state completely', () => {
      useGameStore.setState(state => {
        state.aiThinking = true;
        state.lastAIDiagnostics = {
          move: 0,
          evaluation: 0.5,
          thinking: 'test',
          timings: { aiMoveCalculation: 100, totalHandlerTime: 150 },
          diagnostics: {
            searchDepth: 3,
            validMoves: [0],
            moveEvaluations: [],
            transpositionHits: 0,
            nodesEvaluated: 100,
          },
          aiType: 'server' as const,
        };
        state.lastAIMoveDuration = 100;
        state.lastMoveType = 'move';
        state.lastMovePlayer = 'player1';
      });

      const { actions } = useGameStore.getState();
      actions.reset();

      const state = useGameStore.getState();
      expect(state.aiThinking).toBe(false);
      expect(state.lastAIDiagnostics).toBe(null);
      expect(state.lastAIMoveDuration).toBe(null);
      expect(state.lastMoveType).toBe(null);
      expect(state.lastMovePlayer).toBe(null);
    });
  });

  describe('postGameToServer', () => {
    it('should not post game when game is not finished', async () => {
      const { actions } = useGameStore.getState();
      await actions.postGameToServer();

      // Should not throw or call saveGame
    });

    it('should not post game when winner is null', async () => {
      useGameStore.setState(state => {
        state.gameState.gameStatus = 'finished';
        state.gameState.winner = null;
      });

      const { actions } = useGameStore.getState();
      await actions.postGameToServer();

      // Should not throw or call saveGame
    });

    it('should post game when game is finished with winner', async () => {
      const { saveGame } = await import('@/lib/actions');
      const mockSaveGame = vi.mocked(saveGame);

      useGameStore.setState(state => {
        state.gameState.gameStatus = 'finished';
        state.gameState.winner = 'player1';
      });

      const { actions } = useGameStore.getState();
      await actions.postGameToServer();

      expect(mockSaveGame).toHaveBeenCalled();
    });
  });

  describe('createNearWinningState', () => {
    it('should create a near-winning state for player1', () => {
      const { actions } = useGameStore.getState();
      actions.createNearWinningState();

      const { gameState } = useGameStore.getState();
      expect(gameState.player1Pieces[6].square).toBe(12);
      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.diceRoll).toBe(null);
      expect(gameState.canMove).toBe(false);
      expect(gameState.validMoves).toEqual([]);
    });
  });
});
