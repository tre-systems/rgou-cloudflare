import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';

test('title and subtitle are always visible and unique', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ai-model-selection')).toBeVisible();
  const title = page.getByTestId('main-title');
  const subtitle = page.getByTestId('main-subtitle');
  await expect(title).toBeVisible();
  await expect(subtitle).toBeVisible();
  await expect(page.locator('[data-testid="main-title"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="main-subtitle"]')).toHaveCount(1);
});

test.describe('Game Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-select-classic').click();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('loads main page, shows key elements, and they are interactive', async ({ page }) => {
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();

    await page.getByTestId('sound-toggle').click();

    await page.getByTestId('help-button').click();
    await expect(page.locator('text=How to Play')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('help-close').click();
    await expect(page.locator('text=How to Play')).not.toBeVisible({ timeout: 5000 });

    if (process.env.NODE_ENV === 'development') {
      await expect(page.getByTestId('create-near-winning-state')).toBeVisible();
      await page.getByTestId('create-near-winning-state').click();
    }
  });

  test.fixme('game board is visible and interactive', async ({ page }) => {
    await expect(page.getByTestId('square-0')).toBeVisible();
    await expect(page.getByTestId('square-1')).toBeVisible();

    await expect(page.getByTestId('roll-dice')).toBeVisible();
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(1000); // Add a small delay
    await page.waitForFunction(() => (window as any).useGameStore);
    await page.waitForFunction(() => (window as any).useGameStore.getState().gameState.canMove);

    const squares = page.locator('[data-testid^="square-"]');
    await expect(squares.first()).toBeVisible();
  });

  test('simulate win and verify game is saved and stats panel updates', async ({ page }) => {
    if (process.env.NODE_ENV === 'development') {
      await page.getByTestId('create-near-winning-state').click();

      await page.evaluate(() => {
        const store = (window as any).useGameStore.getState();
        store.actions.processDiceRoll(2);
      });

      const squares = page.locator('[data-testid^="square-"]');
      await squares.nth(12).click();

      await expect(page.locator('text=Victory!')).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId('stats-panel')).toBeVisible();
      await expect(page.getByTestId('wins-count')).toHaveText('1');

      const db = new Database('local.db');
      try {
        const row = db
          .prepare('SELECT * FROM games WHERE winner = ? ORDER BY completedAt DESC LIMIT 1')
          .get('player1');
        expect(row).toBeTruthy();
        const gameRow = row as { winner: string };
        expect(gameRow.winner).toBe('player1');
      } finally {
        db.close();
      }
    }
  });
});
