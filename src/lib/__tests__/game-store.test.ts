import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';
import { useUIStore } from '../ui-store';
import { createTestGameState } from './test-utils';

const incrementWinsMock = vi.fn();
const incrementLossesMock = vi.fn();
const {
  getClassicAIMoveMock,
  getHeuristicAIMoveMock,
  getMLAIMoveMock,
  getOracleAIMoveMock,
  reportUsageMock,
} = vi.hoisted(() => ({
  getClassicAIMoveMock: vi.fn(),
  getHeuristicAIMoveMock: vi.fn(),
  getMLAIMoveMock: vi.fn(),
  getOracleAIMoveMock: vi.fn(),
  reportUsageMock: vi.fn(),
}));

const classicResponse = (move: number | null) => ({
  move,
  evaluation: 12,
  thinking: 'Classic test move',
  timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
  diagnostics: {
    searchDepth: 4,
    validMoves: move === null ? [] : [move],
    moveEvaluations: [],
    transpositionHits: 0,
    nodesEvaluated: 1,
  },
});

const mlResponse = (move: number | null) => ({
  move,
  evaluation: 0.5,
  thinking: 'ML test move',
  timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
  diagnostics: {
    valid_moves: move === null ? [] : [move],
    move_evaluations: [],
    value_network_output: 0.5,
    policy_network_outputs: [],
  },
});

vi.mock('../wasm-ai-service', () => ({
  WasmAiService: class {
    getAIMove = getClassicAIMoveMock;
    getHeuristicAIMove = getHeuristicAIMoveMock;
  },
}));

vi.mock('../ml-ai-service', () => ({
  MLAIService: class {
    getAIMove = getMLAIMoveMock;
  },
}));

vi.mock('../oracle-ai-service', () => ({
  OracleAIService: class {
    getAIMove = getOracleAIMoveMock;
  },
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

vi.mock('../usage', async importOriginal => ({
  ...(await importOriginal<typeof import('../usage')>()),
  reportUsage: reportUsageMock,
}));

describe('GameStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClassicAIMoveMock.mockResolvedValue(classicResponse(0));
    getHeuristicAIMoveMock.mockResolvedValue(classicResponse(0));
    getMLAIMoveMock.mockResolvedValue(mlResponse(0));
    getOracleAIMoveMock.mockResolvedValue(mlResponse(0));
    useUIStore.getState().actions.reset();
    useGameStore.getState().actions.reset();
  });

  describe('initialize', () => {
    it('should initialize game state', () => {
      const { actions } = useGameStore.getState();
      actions.initialize(false);

      const state = useGameStore.getState();
      expect(state.aiThinking).toBe(false);
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

    it('should not count AI-vs-AI results in player statistics', () => {
      useUIStore.getState().actions.setSelectedMode('watch');
      const { actions } = useGameStore.getState();
      actions.createNearWinningState();

      actions.processDiceRoll(2);
      actions.makeMove(6);

      expect(useGameStore.getState().gameState.gameStatus).toBe('finished');
      expect(incrementWinsMock).not.toHaveBeenCalled();
      expect(incrementLossesMock).not.toHaveBeenCalled();
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
      await actions.makeAIMove('classic');

      const { aiThinking } = useGameStore.getState();
      expect(aiThinking).toBe(false);
    });

    it('should handle WASM AI move successfully', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          diceRoll: 2,
          canMove: true,
          validMoves: [0],
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('classic');

      const { aiThinking } = useGameStore.getState();
      expect(aiThinking).toBe(false);
      expect(getClassicAIMoveMock).toHaveBeenCalledOnce();
      expect(useGameStore.getState().gameState.player2Pieces[0].square).toBe(18);
    });

    it('should handle ML AI move successfully', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          diceRoll: 2,
          canMove: true,
          validMoves: [0],
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('ml');

      const { aiThinking } = useGameStore.getState();
      expect(aiThinking).toBe(false);
      expect(getMLAIMoveMock).toHaveBeenCalledOnce();
      expect(useGameStore.getState().gameState.player2Pieces[0].square).toBe(18);
    });

    it('should handle Oracle AI moves through the dedicated service', async () => {
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          diceRoll: 2,
          canMove: true,
          validMoves: [0],
        }),
      });

      await useGameStore.getState().actions.makeAIMove('oracle');

      expect(getOracleAIMoveMock).toHaveBeenCalledOnce();
      expect(useGameStore.getState().gameState.player2Pieces[0].square).toBe(18);
    });

    it('should use fallback when AI returns invalid move', async () => {
      getClassicAIMoveMock.mockResolvedValue(classicResponse(0));
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          canMove: true,
          validMoves: [1],
          diceRoll: 1,
        }),
      });

      const { actions } = useGameStore.getState();
      await actions.makeAIMove('classic');

      const { gameState } = useGameStore.getState();
      // fallback is to take first valid move, which is piece 1
      expect(gameState.player2Pieces[1].square).not.toBe(-1);
    });

    it('ignores an AI response after the game is reset', async () => {
      let resolveMove: ((value: ReturnType<typeof classicResponse>) => void) | undefined;
      getClassicAIMoveMock.mockReturnValue(
        new Promise(resolve => {
          resolveMove = resolve;
        })
      );
      useGameStore.setState({
        gameState: createTestGameState({
          currentPlayer: 'player2',
          diceRoll: 1,
          canMove: true,
          validMoves: [0],
        }),
      });

      const movePromise = useGameStore.getState().actions.makeAIMove('classic');
      useGameStore.getState().actions.reset();
      const resetGameId = useGameStore.getState().gameId;
      resolveMove?.(classicResponse(0));
      await movePromise;

      expect(useGameStore.getState().gameId).toBe(resetGameId);
      expect(useGameStore.getState().gameState.history).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset game state completely', () => {
      useGameStore.setState(state => {
        state.aiThinking = true;
        state.lastMoveType = 'move';
        state.lastMovePlayer = 'player1';
      });

      const { actions } = useGameStore.getState();
      actions.reset();

      const state = useGameStore.getState();
      expect(state.aiThinking).toBe(false);
      expect(state.lastMoveType).toBe(null);
      expect(state.lastMovePlayer).toBe(null);
    });
  });

  describe('usage reporting', () => {
    it('retains the actual starting player for completion analytics', () => {
      const { actions } = useGameStore.getState();
      useUIStore.getState().actions.setSelectedMode('classic');
      useGameStore.setState(state => ({
        ...state,
        gameState: createTestGameState({ currentPlayer: 'player2' }),
      }));

      actions.reportGameStarted('classic');
      useGameStore.setState(state => ({
        ...state,
        gameState: createTestGameState({
          currentPlayer: 'player1',
          gameStatus: 'finished',
          winner: 'player1',
          history: [],
        }),
      }));
      actions.reportGameCompleted();

      expect(reportUsageMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ event: 'game_completed', startedBy: 'player2' })
      );
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
      expect(gameState.history).toEqual([]);
      expect(gameState.board.filter(Boolean)).toHaveLength(1);
    });
  });
});
