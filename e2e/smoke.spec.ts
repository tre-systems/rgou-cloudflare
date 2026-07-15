import { expect, test, type Page } from '@playwright/test';

async function startGame(page: Page, mode: 'classic' | 'ml' | 'oracle' | 'watch' = 'classic') {
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

async function setNearWinningRoll(page: Page, roll = 1) {
  await page.evaluate(value => {
    const { actions } = window.useGameStore.getState();
    actions.createNearWinningState();
    actions.processDiceRoll(value);
  }, roll);
}

test.describe('Core Game Functionality', () => {
  test('can start a classic game and see initial state', async ({ page }) => {
    await startGame(page, 'classic');
    await expect(page.getByTestId('game-status-text')).toContainText('Your turn');
    await expect(page.getByTestId('dice-display')).toBeVisible();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('can start ML game and see AI opponent', async ({ page }) => {
    await startGame(page, 'ml');
    await expect(page.getByTestId('game-status-text')).toContainText('Your turn');
    await expect(page.getByTestId('dice-display')).toBeVisible();
  });

  test('loads Oracle and returns a legal move from the production model', async ({ page }) => {
    const failures: string[] = [];
    let modelRequests = 0;
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('AI worker oracle request failed')) {
        failures.push(message.text());
      }
    });
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/oracle-weights.json.gz') modelRequests += 1;
    });

    await startGame(page, 'oracle');
    await page.evaluate(async () => {
      const { actions } = window.useGameStore.getState();
      actions.createNearWinningState();
      actions.processDiceRoll(2);
      await actions.makeAIMove('oracle', true);
    });

    await expect.poll(() => modelRequests, { timeout: 10000 }).toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate(() => window.useGameStore.getState().lastAIDiagnostics?.aiType))
      .toBe('oracle');
    expect(failures).toEqual([]);
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
    await expect.poll(() => modelRequests, { timeout: 10000 }).toBeGreaterThan(0);
    await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
    expect(mlFailures).toEqual([]);
  });
});

test.describe('Game Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page, 'classic');
  });

  test('automatically rolls and displays the dice', async ({ page }) => {
    await setNearWinningRoll(page);

    const dice = page.getByTestId('dice-display');
    await expect(dice).toBeVisible();
    await expect(dice).toHaveAttribute('aria-label', /^Dice roll: [0-4]$/, { timeout: 2000 });
  });

  test('can make a legal move with the keyboard', async ({ page }) => {
    await setNearWinningRoll(page);

    const piece = page.getByRole('button', { name: 'Move piece 7 from square 12' });
    await piece.focus();
    await piece.press('Enter');

    await expect(
      page.getByTestId('square-13').getByTestId('game-piece-player1-static')
    ).toBeVisible();
  });

  test('can toggle sound settings', async ({ page }) => {
    const soundToggle = page.getByTestId('sound-toggle');
    await expect(soundToggle).toBeVisible();

    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute('aria-label', 'Enable sound');
  });

  test('can open and close help panel', async ({ page }) => {
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('help-panel')).toBeVisible();
    await expect(page.getByTestId('help-close')).toBeVisible();

    await page.getByTestId('help-close').click();
    await expect(page.getByTestId('help-panel')).not.toBeVisible();

    await page.getByTestId('help-button').click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('help-panel')).not.toBeVisible();
  });

  test('can return to opponent selection', async ({ page }) => {
    await page.getByTestId('change-opponent').click();

    await expect(page.getByTestId('ai-model-selection')).toBeVisible();
    await expect(page.getByTestId('game-board')).not.toBeVisible();
  });
});

test.describe('Game Completion and Usage Reporting', () => {
  async function simulateGameWin(page: Page) {
    await page.evaluate(() => {
      const store = window.useGameStore.getState();
      store.actions.createNearWinningState();
      store.actions.processDiceRoll(2);
      store.actions.makeMove(6);
    });

    await waitForGameCompletion(page);
  }

  test('completes a game and shows completion overlay', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateGameWin(page);

    await expect(page.getByTestId('game-completion-overlay')).toBeVisible();
    await expect(page.getByTestId('game-completion-title')).toBeVisible();
    await expect(page.getByTestId('game-completion-message')).toBeVisible();

    await expect(page.getByTestId('stats-panel')).toBeVisible();
    await expect(page.getByTestId('wins-count')).toContainText('1');
  });

  for (const mode of ['classic', 'ml', 'oracle', 'watch'] as const) {
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
      const store = window.useGameStore.getState();
      store.actions.reportGameCompleted();
      store.actions.reportGameCompleted();
    });
    await expect.poll(() => events.length).toBe(2);
    expect(events.filter(event => event.event === 'game_completed')).toHaveLength(1);
  });

  test('can reset game after completion', async ({ page }) => {
    await startGame(page, 'classic');
    await simulateGameWin(page);

    await page.getByTestId('reset-game-button').click();
    await expect(page.getByTestId('ai-model-selection')).toBeVisible();
  });
});

test.describe('Persistence', () => {
  test('maintains game state during navigation', async ({ page }) => {
    await startGame(page, 'classic');
    await setNearWinningRoll(page);
    await expect(page.getByTestId('dice-display')).toHaveAttribute('aria-label', 'Dice roll: 1');

    await page.reload();

    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('ai-model-selection')).not.toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('game is fully functional on mobile', async ({ page }) => {
    await startGame(page, 'classic');
    await setNearWinningRoll(page);

    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('dice-display')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();

    await expect(page.getByTestId('dice-display')).toHaveAttribute('aria-label', 'Dice roll: 1');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });
});
