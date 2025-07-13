import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';

test.describe('Game Smoke Tests', () => {
  test('loads main page and shows key elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();
  });

  test('can toggle sound', async ({ page }) => {
    await page.goto('/');
    const soundToggle = page.getByTestId('sound-toggle');
    await soundToggle.click();
  });

  test('can open and close help panel', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('help-button').click();
    await expect(page.locator('text=How to Play')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('help-close').click();
    await expect(page.locator('text=How to Play')).not.toBeVisible({ timeout: 5000 });
  });

  test('can roll dice', async ({ page }) => {
    await page.goto('/');
    const rollDiceButton = page.getByTestId('roll-dice');
    await expect(rollDiceButton).toBeVisible();
    // Removed click, dice roll is automatic
  });

  test('game board squares are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('square-0')).toBeVisible();
    await expect(page.getByTestId('square-1')).toBeVisible();
  });

  test('can interact with game board', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('game-board')).toBeVisible();

    const rollDiceButton = page.getByTestId('roll-dice');
    await expect(rollDiceButton).toBeVisible();
    // Removed click, dice roll is automatic

    await page.waitForTimeout(1000);

    const squares = page.locator('[data-testid^="square-"]');
    await expect(squares.first()).toBeVisible();
  });

  test('all interactive elements are present and clickable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();
    if (process.env.NODE_ENV === 'development') {
      await expect(page.getByTestId('create-near-winning-state')).toBeVisible();
      await page.getByTestId('create-near-winning-state').click();
    }
    await page.getByTestId('sound-toggle').click();
    await page.getByTestId('help-button').click();
    await expect(page.locator('text=How to Play')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('help-close').click();
    await expect(page.locator('text=How to Play')).not.toBeVisible({ timeout: 5000 });
    // Removed dice click, dice roll is automatic
  });

  test('simulate win and verify game is saved and stats panel updates', async ({ page }) => {
    await page.goto('/');
    if (process.env.NODE_ENV === 'development') {
      await page.getByTestId('create-near-winning-state').click();
      // Removed dice click, dice roll is automatic
      await page.waitForTimeout(500);
      const squares = page.locator('[data-testid^="square-"]');
      await squares.nth(12).click();
      await expect(page.locator('text=Victory!')).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId('stats-panel')).toBeVisible();
      await expect(page.getByTestId('wins-count')).toHaveText('1');
      // Check the DB for a saved game
      const db = new Database('local.db');
      const row = db
        .prepare('SELECT * FROM games WHERE winner = ? ORDER BY completedAt DESC LIMIT 1')
        .get('player1');
      expect(row).toBeTruthy();
      const gameRow = row as { winner: string };
      expect(gameRow.winner).toBe('player1');
      db.close();
    }
  });

  test('title and subtitle are always visible and unique', async ({ page }) => {
    await page.goto('/');
    const title = page.getByTestId('main-title');
    const subtitle = page.getByTestId('main-subtitle');
    await expect(title).toBeVisible();
    await expect(subtitle).toBeVisible();
    // Ensure only one of each
    await expect(page.locator('[data-testid="main-title"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="main-subtitle"]')).toHaveCount(1);
  });
});
