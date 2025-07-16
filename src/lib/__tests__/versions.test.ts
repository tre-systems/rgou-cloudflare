import { describe, it, expect } from 'vitest';
import { VERSIONS, getVersionString, getVersionsForDB } from '../versions';

describe('versions', () => {
  describe('VERSIONS', () => {
    it('should have all required version fields', () => {
      expect(VERSIONS).toHaveProperty('app');
      expect(VERSIONS).toHaveProperty('classicAI');
      expect(VERSIONS).toHaveProperty('mlAI');
      expect(VERSIONS).toHaveProperty('game');
    });

    it('should have semantic version format', () => {
      const versionRegex = /^\d+\.\d+\.\d+$/;
      expect(VERSIONS.app).toMatch(versionRegex);
      expect(VERSIONS.classicAI).toMatch(versionRegex);
      expect(VERSIONS.mlAI).toMatch(versionRegex);
      expect(VERSIONS.game).toMatch(versionRegex);
    });

    it('should have consistent version numbers', () => {
      expect(VERSIONS.app).toBe('1.0.0');
      expect(VERSIONS.classicAI).toBe('1.0.0');
      expect(VERSIONS.mlAI).toBe('1.0.0');
      expect(VERSIONS.game).toBe('1.0.0');
    });
  });

  describe('getVersionString', () => {
    it('should return formatted version string', () => {
      const versionString = getVersionString();
      expect(versionString).toBe('app:1.0.0,classic:1.0.0,ml:1.0.0,game:1.0.0');
    });
  });

  describe('getVersionsForDB', () => {
    it('should return correct database version mapping', () => {
      const dbVersions = getVersionsForDB();
      expect(dbVersions).toEqual({
        gameVersion: '1.0.0',
        ai1Version: '1.0.0',
        ai2Version: '1.0.0',
      });
    });

    it('should match VERSIONS constants', () => {
      const dbVersions = getVersionsForDB();
      expect(dbVersions.gameVersion).toBe(VERSIONS.app);
      expect(dbVersions.ai1Version).toBe(VERSIONS.classicAI);
      expect(dbVersions.ai2Version).toBe(VERSIONS.mlAI);
    });
  });
});
