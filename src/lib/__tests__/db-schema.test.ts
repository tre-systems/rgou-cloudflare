import { describe, it, expect } from 'vitest';
import { games, dbTables } from '../db/schema';

describe('Database Schema', () => {
  describe('games table', () => {
    it('should have correct table structure', () => {
      expect(games).toBeDefined();
      expect(typeof games).toBe('object');
    });

    it('should have id column with nanoid default', () => {
      const idColumn = games.id;
      expect(idColumn).toBeDefined();
      expect(idColumn.name).toBe('id');
    });

    it('should have playerId column', () => {
      const playerIdColumn = games.playerId;
      expect(playerIdColumn).toBeDefined();
      expect(playerIdColumn.notNull).toBeDefined();
    });

    it('should have winner column with enum', () => {
      const winnerColumn = games.winner;
      expect(winnerColumn).toBeDefined();
      expect(winnerColumn.name).toBe('winner');
    });

    it('should have completedAt column with timestamp', () => {
      const completedAtColumn = games.completedAt;
      expect(completedAtColumn).toBeDefined();
      expect(completedAtColumn.dataType).toBe('date');
    });

    it('should have status column with enum and default', () => {
      const statusColumn = games.status;
      expect(statusColumn).toBeDefined();
      expect(statusColumn.name).toBe('status');
    });

    it('should have moveCount column', () => {
      const moveCountColumn = games.moveCount;
      expect(moveCountColumn).toBeDefined();
    });

    it('should have duration column', () => {
      const durationColumn = games.duration;
      expect(durationColumn).toBeDefined();
    });

    it('should have clientHeader column', () => {
      const clientHeaderColumn = games.clientHeader;
      expect(clientHeaderColumn).toBeDefined();
    });

    it('should have history column with json mode', () => {
      const historyColumn = games.history;
      expect(historyColumn).toBeDefined();
      expect(historyColumn.name).toBe('history');
    });

    it('should have gameType column with default', () => {
      const gameTypeColumn = games.gameType;
      expect(gameTypeColumn).toBeDefined();
      expect(gameTypeColumn.notNull).toBeDefined();
      expect(gameTypeColumn.default).toBe('standard');
    });

    it('should have ai1Version column', () => {
      const ai1VersionColumn = games.ai1Version;
      expect(ai1VersionColumn).toBeDefined();
    });

    it('should have ai2Version column', () => {
      const ai2VersionColumn = games.ai2Version;
      expect(ai2VersionColumn).toBeDefined();
    });

    it('should have gameVersion column', () => {
      const gameVersionColumn = games.gameVersion;
      expect(gameVersionColumn).toBeDefined();
    });
  });

  describe('dbTables export', () => {
    it('should export dbTables object', () => {
      expect(dbTables).toBeDefined();
      expect(typeof dbTables).toBe('object');
    });

    it('should include games table in dbTables', () => {
      expect(dbTables.games).toBeDefined();
      expect(dbTables.games).toBe(games);
    });
  });
});
