import { test, expect, Page } from '@playwright/test';
import Database from 'better-sqlite3';

async function startGame(page: Page, mode: 'classic' | 'ml' | 'watch' = 'classic') {
  await page.goto('/');
  await page.getByTestId(`mode-select-${mode}`).click();
  await expect(page.getByTestId('game-board')).toBeVisible();
}

test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test('main controls are visible and usable on mobile', async ({ page }) => {
    await startGame(page, 'classic');
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();
  });
});

test.describe('Landing Page', () => {
  test('title and subtitle are always visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ai-model-selection')).toBeVisible();
    await expect(page.getByTestId('main-title')).toBeVisible();
    await expect(page.getByTestId('main-subtitle')).toBeVisible();
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

  test('can see the dice roll and move a piece', async ({ page }) => {
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

test.describe('Game Completion, Stats, and Save', () => {
  type GameRow = {
    gameType: string;
    winner: string;
  };

  async function simulateWin(page: Page) {
    await page.getByTestId('create-near-winning-state').click();
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.actions.processDiceRoll(2);
    });
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.actions.makeMove(6);
    });
    await page.waitForTimeout(1000);
  }

  async function verifySavedGame(
    { mode, expectedGameType }: { mode: 'classic' | 'ml' | 'watch'; expectedGameType: string },
    page: Page
  ) {
    await startGame(page, mode);
    await simulateWin(page);
    await expect(page.getByTestId('game-completion-overlay')).toBeVisible();
    const db = new Database('local.db');
    try {
      const row = db
        .prepare(
          'SELECT * FROM games WHERE winner = ? AND gameType = ? ORDER BY completedAt DESC LIMIT 1'
        )
        .get('player1', expectedGameType) as GameRow | undefined;
      expect(row).toBeTruthy();
      if (row) {
        expect(row.gameType).toBe(expectedGameType);
      }
    } finally {
      db.close();
    }
  }

  test('simulate win and verify overlay, stats, and reset', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateWin(page);
    await expect(page.getByTestId('game-completion-overlay')).toBeVisible();
    await expect(page.getByTestId('game-completion-title')).toBeVisible();
    await expect(page.getByTestId('game-completion-message')).toBeVisible();
    await expect(page.getByTestId('stats-panel')).toBeVisible();
    await expect(page.getByTestId('wins-count')).toHaveText('1');
    await page.getByTestId('reset-game-button').click();
    await expect(page.getByTestId('ai-model-selection')).toBeVisible();
  });

  for (const { mode, expectedGameType } of [
    { mode: 'classic' as const, expectedGameType: 'classic' },
    { mode: 'ml' as const, expectedGameType: 'ml' },
    { mode: 'watch' as const, expectedGameType: 'watch' },
  ]) {
    test(`simulate win and verify game is saved in local.db for ${mode}`, async ({ page }) => {
      if (process.env.NODE_ENV === 'development') {
        await verifySavedGame({ mode, expectedGameType }, page);
      }
    });
  }

  test('win increments stats panel', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateWin(page);
    await expect(page.getByTestId('game-completion-overlay')).toBeVisible();
    await expect(page.getByTestId('stats-panel')).toBeVisible();
    const winCount = await page.getByTestId('wins-count').innerText();
    expect(Number(winCount)).toBeGreaterThan(0);
  });
});

test.describe('Help Panel Accessibility', () => {
  test('help panel opens and closes correctly', async ({ page }) => {
    await startGame(page, 'classic');
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('help-panel')).toBeVisible();
    await page.getByTestId('help-close').click();
    await expect(page.getByTestId('help-panel')).not.toBeVisible();
  });
});
