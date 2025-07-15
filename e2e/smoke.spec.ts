import { test, expect, Page } from '@playwright/test';

// Utility functions for repeated actions
async function startGame(page: Page, mode: 'classic' | 'ml' | 'watch' = 'classic') {
  await page.goto('/');
  await page.getByTestId(`mode-select-${mode}`).click();
  await expect(page.getByTestId('game-board')).toBeVisible();
}

// Main page tests

test.describe('Landing Page', () => {
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
});

test.describe('Mode Selection', () => {
  test('can select ML AI mode and start game', async ({ page }) => {
    await startGame(page, 'ml');
    await expect(page.getByTestId('game-status-text')).toContainText('Your turn');
  });

  test('can select Watch mode and see AI vs AI', async ({ page }) => {
    await startGame(page, 'watch');
    await expect(page.getByTestId('game-status-text')).toContainText("'s turn");
  });
});

test.describe('Game Board Interactivity', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page, 'classic');
  });

  test('can roll dice and move a piece', async ({ page }) => {
    await expect(page.getByTestId('roll-dice')).toBeVisible();
    const startPiece = await page.locator('[data-testid^="player1-start-piece-"]').first();
    if (await startPiece.isVisible()) {
      await startPiece.click();
    }
    await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
  });

  test('can toggle sound', async ({ page }) => {
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await page.getByTestId('sound-toggle').click();
  });

  test('can open and close How To Play panel', async ({ page }) => {
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('help-close')).toBeVisible();
    await page.getByTestId('help-close').click();
  });
});

test.describe('Game Completion and Stats', () => {
  test('simulate win and verify overlay, stats, and reset', async ({ page }) => {
    if (process.env.NODE_ENV === 'development') {
      await startGame(page, 'classic');
      await page.getByTestId('create-near-winning-state').click();
      await page.evaluate(() => {
        const store = (window as any).useGameStore.getState();
        store.actions.processDiceRoll(2);
      });
      const squares = page.locator('[data-testid^="square-"]');
      await squares.nth(12).click();
      await expect(page.getByTestId('game-completion-overlay')).toBeVisible();
      await expect(page.getByTestId('game-completion-title')).toBeVisible();
      await expect(page.getByTestId('game-completion-message')).toBeVisible();
      await expect(page.getByTestId('stats-panel')).toBeVisible();
      await expect(page.getByTestId('wins-count')).toHaveText('1');
      await page.getByTestId('reset-game-button').click();
      await expect(page.getByTestId('ai-model-selection')).toBeVisible();
    }
  });
});
