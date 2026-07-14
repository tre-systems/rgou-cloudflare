import { test, expect, Page } from '@playwright/test';

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

async function captureUsage(page: Page) {
  const events: Array<Record<string, unknown>> = [];
  await page.route('**/api/usage', async route => {
    events.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>);
    await route.fulfill({ status: 202, body: 'Accepted' });
  });
  return events;
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
    const mlFailures: string[] = [];
    let modelRequests = 0;
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('AI worker ml request failed')) {
        mlFailures.push(message.text());
      }
    });
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/ml-weights.json.gz') modelRequests += 1;
    });

    await startGame(page, 'watch');
    await expect(page.getByTestId('game-status-text')).toContainText("'s turn");
    await expect.poll(() => modelRequests, { timeout: 5000 }).toBeGreaterThan(0);
    await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
    expect(mlFailures).toEqual([]);
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

test.describe('Game Completion and Usage Reporting', () => {
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

  for (const mode of ['classic', 'ml', 'watch'] as const) {
    test(`reports ${mode} game lifecycle analytics`, async ({ page }) => {
      const events = await captureUsage(page);
      await startGame(page, mode);
      await simulateGameWin(page);
      await expect.poll(() => events.length).toBe(2);
      expect(events).toEqual([
        expect.objectContaining({ event: 'game_started', mode }),
        expect.objectContaining({ event: 'game_completed', mode, winner: 'player1', moves: 1 }),
      ]);
    });
  }

  test('reports a completed game only once when the completion effect repeats', async ({
    page,
  }) => {
    const events = await captureUsage(page);
    await startGame(page, 'classic');
    await simulateGameWin(page);
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.actions.reportGameCompleted();
      store.actions.reportGameCompleted();
    });
    await expect.poll(() => events.length).toBe(2);
    expect(events.filter(event => event.event === 'game_completed')).toHaveLength(1);
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
