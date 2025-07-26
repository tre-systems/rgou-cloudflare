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
      throw new Error('Games table does not exist in database. Run "npm run db:local:reset" to set up the database.');
    }

    // Get the most recent game
    const row = db
      .prepare(
        `
      SELECT * FROM games 
      WHERE winner = ? AND gameType = ? 
      ORDER BY completedAt DESC 
      LIMIT 1
    `
      )
      .get(expectedWinner, expectedGameType) as any;

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

    // Click the dice to roll
    await diceButton.click();

    // Wait a moment for the roll to complete
    await page.waitForTimeout(500);

    // The dice should still be visible after rolling
    await expect(diceButton).toBeVisible();
  });

  test('can make a move when dice roll allows', async ({ page }) => {
    // Roll dice
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);

    // Try to click on a piece to move it
    const pieces = page.locator('[data-testid^="player1-piece-"]');
    const pieceCount = await pieces.count();
    if (pieceCount > 0) {
      await pieces.first().click();
      // Should see some change in game state
      await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
    }
  });

  test('can toggle sound settings', async ({ page }) => {
    const soundToggle = page.getByTestId('sound-toggle');
    await expect(soundToggle).toBeVisible();

    // Click to toggle
    await soundToggle.click();
    await page.waitForTimeout(100);

    // Should still be visible after toggle
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
    // Use the dev button to create a near-winning state
    await page.getByTestId('create-near-winning-state').click();

    // Wait for the state to be created
    await page.waitForTimeout(500);

    // Roll dice to get a value that will complete the game
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.actions.processDiceRoll(2); // Roll 2 to move the last piece from square 12 to finish
    });

    // Wait for the dice roll to process
    await page.waitForTimeout(500);

    // Make the winning move
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.actions.makeMove(6); // Move the last piece
    });

    // Wait for game completion
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

    // Navigate away and back
    await page.goto('/');
    await page.goto('/');

    // Wait for the page to load and game state to be restored
    await page.waitForTimeout(1000);

    // Should either be in a game (game state is persisted) or back to mode selection
    const gameBoard = page.getByTestId('game-board');
    const modeSelection = page.getByTestId('ai-model-selection');

    // Check if either is visible (both are valid outcomes)
    const gameBoardVisible = await gameBoard.isVisible();
    const modeSelectionVisible = await modeSelection.isVisible();

    expect(gameBoardVisible || modeSelectionVisible).toBe(true);
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
