import { test, expect, Page } from '@playwright/test';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

// Ensure database is set up before running tests
test.beforeAll(async () => {
  const dbPath = 'local.db';
  if (!existsSync(dbPath)) {
    console.log('Database not found, setting up...');
    execSync('npm run db:local:reset', { stdio: 'inherit' });
  }
});

async function startGame(page: Page, mode: 'classic' | 'ml' | 'watch' = 'classic') {
  await page.goto('/');
  await page.getByTestId(`mode-select-${mode}`).click();
  await expect(page.getByTestId('game-board')).toBeVisible();
}

async function waitForGameCompletion(page: Page) {
  await expect(page.getByTestId('game-completion-overlay')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('game-completion-title')).toBeVisible();
  await expect(page.getByTestId('game-completion-message')).toBeVisible();
}

async function verifyDatabaseSave(expectedGameType: string, expectedWinner: string = 'player1') {
  const dbPath = 'local.db';
  if (!existsSync(dbPath)) {
    console.error(`Database file not found: ${dbPath}`);
    console.log('Attempting to set up database...');
    execSync('npm run db:local:reset', { stdio: 'inherit' });

    if (!existsSync(dbPath)) {
      throw new Error(`Database file still not found after setup: ${dbPath}`);
    }
  }

  const db = new Database(dbPath);
  try {
    // Verify the games table exists
    const tableExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='games'
    `
      )
      .get();

    if (!tableExists) {
      console.error('Games table does not exist in database');
      console.log('Available tables:');
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log(tables);
      throw new Error(
        'Games table does not exist in database. Run "npm run db:local:reset" to set up the database.'
      );
    }

    const findSavedGame = db.prepare(`
      SELECT * FROM games
      WHERE winner = ? AND gameType = ?
      ORDER BY completedAt DESC
      LIMIT 1
    `);

    const deadline = Date.now() + 5000;
    let row = findSavedGame.get(expectedWinner, expectedGameType) as any;
    while (!row && Date.now() < deadline) {
      await pageWait(100);
      row = findSavedGame.get(expectedWinner, expectedGameType) as any;
    }

    if (!row) {
      throw new Error(
        `No game found with winner=${expectedWinner} and gameType=${expectedGameType}`
      );
    }

    // Verify required fields
    expect(row.winner).toBe(expectedWinner);
    expect(row.gameType).toBe(expectedGameType);
    expect(row.playerId).toBeTruthy();
    expect(row.completedAt).toBeTruthy();
    expect(row.moveCount).toBeGreaterThan(0);
    expect(row.history).toBeTruthy();

    // Verify history is valid JSON
    const history = JSON.parse(row.history);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    return row;
  } finally {
    db.close();
  }
}

function pageWait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test.describe('Core Game Functionality', () => {
  test('can start a classic game and see initial state', async ({ page }) => {
    await startGame(page, 'classic');
    await expect(page.getByTestId('game-status-text')).toContainText('Your turn');
    await expect(page.getByTestId('roll-dice')).toBeVisible();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('can start ML game and see AI opponent', async ({ page }) => {
    await startGame(page, 'ml');
    await expect(page.getByTestId('game-status-text')).toContainText('Your turn');
    await expect(page.getByTestId('roll-dice')).toBeVisible();
  });

  test('can start watch mode and see AI vs AI', async ({ page }) => {
    await startGame(page, 'watch');
    await expect(page.getByTestId('game-status-text')).toContainText("'s turn");
    // In watch mode, AI should make moves automatically
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
  });
});

test.describe('Game Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page, 'classic');
  });

  test('can roll dice and see it changes', async ({ page }) => {
    const diceButton = page.getByTestId('roll-dice');
    await expect(diceButton).toBeVisible();

    await diceButton.click();
    await page.waitForTimeout(500);

    await expect(diceButton).toBeVisible();
  });

  test('can make a move when dice roll allows', async ({ page }) => {
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);

    const pieces = page.locator('[data-testid^="player1-piece-"]');
    const pieceCount = await pieces.count();
    if (pieceCount > 0) {
      await pieces.first().click();
      await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
    }
  });

  test('can toggle sound settings', async ({ page }) => {
    const soundToggle = page.getByTestId('sound-toggle');
    await expect(soundToggle).toBeVisible();

    await soundToggle.click();
    await page.waitForTimeout(100);

    await expect(soundToggle).toBeVisible();
  });

  test('can open and close help panel', async ({ page }) => {
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('help-panel')).toBeVisible();
    await expect(page.getByTestId('help-close')).toBeVisible();

    await page.getByTestId('help-close').click();
    await expect(page.getByTestId('help-panel')).not.toBeVisible();
  });
});

test.describe('Game Completion and Database Saves', () => {
  async function simulateGameWin(page: Page) {
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.actions.createNearWinningState();
      store.actions.processDiceRoll(2);
      store.actions.makeMove(6);
    });

    await waitForGameCompletion(page);
  }

  test('completes a game and shows completion overlay', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateGameWin(page);

    // Verify completion overlay
    await expect(page.getByTestId('game-completion-overlay')).toBeVisible();
    await expect(page.getByTestId('game-completion-title')).toBeVisible();
    await expect(page.getByTestId('game-completion-message')).toBeVisible();

    // Verify stats panel shows the win
    await expect(page.getByTestId('stats-panel')).toBeVisible();
    await expect(page.getByTestId('wins-count')).toContainText('1');
  });

  test('saves completed classic game to database', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateGameWin(page);

    // Verify the game was saved to database
    const savedGame = await verifyDatabaseSave('classic');
    expect(savedGame).toBeTruthy();
    expect(savedGame.winner).toBe('player1');
    expect(savedGame.gameType).toBe('classic');
  });

  test('saves completed ML game to database', async ({ page }) => {
    await startGame(page, 'ml');
    await simulateGameWin(page);

    const savedGame = await verifyDatabaseSave('ml');
    expect(savedGame).toBeTruthy();
    expect(savedGame.winner).toBe('player1');
    expect(savedGame.gameType).toBe('ml');
  });

  test('saves completed watch game to database', async ({ page }) => {
    await startGame(page, 'watch');
    await simulateGameWin(page);

    const savedGame = await verifyDatabaseSave('watch');
    expect(savedGame).toBeTruthy();
    expect(savedGame.winner).toBe('player1');
    expect(savedGame.gameType).toBe('watch');
  });

  test('saves a completed game only once when the completion effect repeats', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateGameWin(page);

    const savedGame = await verifyDatabaseSave('classic');
    await page.evaluate(async () => {
      const store = (window as any).useGameStore.getState();
      await store.actions.postGameToServer();
      await store.actions.postGameToServer();
    });

    const db = new Database('local.db');
    try {
      const row = db
        .prepare('SELECT COUNT(*) AS count FROM games WHERE id = ?')
        .get(savedGame.id) as {
        count: number;
      };
      expect(row.count).toBe(1);
    } finally {
      db.close();
    }
  });

  test('can reset game after completion', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateGameWin(page);

    // Click reset button
    await page.getByTestId('reset-game-button').click();

    // Should return to mode selection
    await expect(page.getByTestId('ai-model-selection')).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('handles rapid dice rolls gracefully', async ({ page }) => {
    await startGame(page, 'classic');

    // Rapidly click dice roll
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('roll-dice').click();
      await page.waitForTimeout(50);
    }

    // Should still be functional
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('handles rapid piece clicks gracefully', async ({ page }) => {
    await startGame(page, 'classic');

    // Roll dice first
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);

    // Rapidly click pieces
    const pieces = page.locator('[data-testid^="player1-piece-"]');
    const pieceCount = await pieces.count();
    if (pieceCount > 0) {
      for (let i = 0; i < 3; i++) {
        await pieces.first().click();
        await page.waitForTimeout(50);
      }
    }

    // Should still be functional
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('maintains game state during navigation', async ({ page }) => {
    await startGame(page, 'classic');

    // Make some game progress
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);

    await page.reload();

    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('ai-model-selection')).not.toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('game is fully functional on mobile', async ({ page }) => {
    await startGame(page, 'classic');

    // Verify all key elements are visible and functional
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();

    // Test basic interactions
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('roll-dice')).toBeVisible();
  });
});
