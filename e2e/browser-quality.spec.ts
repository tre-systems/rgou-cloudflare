import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function waitForActiveServiceWorker(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

test('core navigation is semantic and keyboard-operable @cross-browser', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Royal Game of Ur' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Choose a game' })).toBeVisible();
  await expect(page.getByText('AI Diagnostics')).toHaveCount(0);

  const classicMode = page.getByRole('button', { name: /^Classic AI/ });
  await expect(classicMode).toBeVisible();
  await expect(page.getByRole('button', { name: /^Machine Learning AI/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Oracle AI/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Watch a Match/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'How to play' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub Repository' })).toHaveAttribute(
    'rel',
    /noopener/
  );

  await classicMode.focus();
  await expect(classicMode).toBeFocused();
  await classicMode.press('Enter');

  await expect(page.getByTestId('game-board')).toBeVisible();
  await expect(page.getByRole('button', { name: 'How to Play' })).toBeVisible();
  await expect(page.getByRole('button', { name: /sound/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quit game and choose another opponent' })).toBeVisible();
  await expect(page.getByTestId('game-board')).not.toContainText('Expectiminimax algorithm');
});

test('keeps opponent choices simple and provides optional AI details', async ({ page }) => {
  await page.goto('/');

  const oracle = page.getByTestId('mode-select-oracle');
  await expect(oracle).toContainText('The strongest opponent.');
  await expect(oracle).not.toContainText('Solved-game model');
  await expect(oracle).not.toContainText('01');

  const detailsButton = page.getByTestId('opponent-details-button');
  await detailsButton.click();

  const dialog = page.getByRole('dialog', { name: 'About the AIs' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Value network · solved-game training');
  await expect(dialog).toContainText('Expectiminimax · depth 3');
  await expect(dialog).toContainText('Policy and value networks · self-play');

  const closeButton = page.getByRole('button', { name: 'Close AI details' });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  await closeButton.click();
  await expect(dialog).toBeHidden();
  await expect(detailsButton).toBeFocused();

  await detailsButton.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(detailsButton).toBeFocused();

  await page.getByTestId('mode-select-watch').click();
  const watchSetup = page.getByTestId('watch-match-selection');
  await expect(watchSetup).toBeVisible();
  await expect(watchSetup).toContainText('Strongest');
  await expect(watchSetup).toContainText('Plans ahead');
  await expect(watchSetup).toContainText('Unpredictable');
  await expect(watchSetup).not.toContainText('Solved-game model');
  await expect(watchSetup).not.toContainText('Depth-4 search');
  await expect(watchSetup).not.toContainText('Self-play model');
});

test('keeps the mobile opening compact and player panels stable between turns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const openingLayout = await page.evaluate(() => {
    const title = document.querySelector('[data-testid="main-title"]');
    if (!title) throw new Error('Main title is missing');

    return {
      titleTop: title.getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });

  expect(openingLayout.titleTop).toBeLessThan(64);
  expect(openingLayout.scrollHeight).toBeLessThanOrEqual(openingLayout.viewportHeight);

  await page.getByTestId('mode-select-classic').click();
  await expect(page.getByTestId('game-board')).toBeVisible();

  const beforeTurnChange = await page.evaluate(() => {
    const getRect = (testId: string) => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      if (!element) throw new Error(`${testId} is missing`);
      const { height, width } = element.getBoundingClientRect();
      return { height, width };
    };

    return {
      board: getRect('game-board'),
      player1: getRect('player1-area'),
      player2: getRect('player2-area'),
    };
  });

  const gameAfterMove = await page.evaluate(() => {
    const { actions } = window.useGameStore.getState();
    actions.reset();
    const startingPlayer = window.useGameStore.getState().gameState.currentPlayer;
    actions.processDiceRoll(2);
    actions.makeMove(0);
    const { gameState } = window.useGameStore.getState();
    return { currentPlayer: gameState.currentPlayer, diceRoll: gameState.diceRoll, startingPlayer };
  });
  expect(gameAfterMove.diceRoll).toBeNull();
  expect(gameAfterMove.currentPlayer).not.toBe(gameAfterMove.startingPlayer);
  await page.waitForFunction(
    currentPlayer =>
      document
        .querySelector(`[data-testid="${currentPlayer}-area"]`)
        ?.classList.contains('player-area-current'),
    gameAfterMove.currentPlayer
  );

  const afterTurnChange = await page.evaluate(() => {
    const getRect = (testId: string) => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      if (!element) throw new Error(`${testId} is missing`);
      const { height, width } = element.getBoundingClientRect();
      return { height, width };
    };

    return {
      board: getRect('game-board'),
      player1: getRect('player1-area'),
      player2: getRect('player2-area'),
    };
  });

  for (const region of ['board', 'player1', 'player2'] as const) {
    expect(afterTurnChange[region].width).toBeCloseTo(beforeTurnChange[region].width, 1);
    expect(afterTurnChange[region].height).toBeCloseTo(beforeTurnChange[region].height, 1);
  }
});

test('Oracle AI project note explains the model and returns to the game', async ({ page }) => {
  await page.goto('/oracle-ai');

  await expect(page).toHaveTitle('Oracle AI · Royal Game of Ur');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://gameofur.org/oracle-ai'
  );
  await expect(page.getByTestId('oracle-ai-page')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Using the solved game to build a better opponent',
    })
  ).toBeVisible();
  await expect(page.getByText('137,892,016')).toBeVisible();
  await expect(page.getByText('0.344 points')).toBeVisible();
  await expect(page.getByText('85%')).toBeVisible();
  await expect(page.getByText('96%')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Implementation and reproducibility notes' })
  ).toHaveAttribute('rel', /noopener/);
  await expect(page.getByRole('link', { name: 'Current browser-opponent results' })).toHaveAttribute(
    'rel',
    /noopener/
  );

  await page.getByRole('link', { name: 'Play the game' }).click();
  await expect(page.getByTestId('ai-model-selection')).toBeVisible();
});

test('honors the reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const durations = await page.evaluate(() => {
    const element = document.createElement('div');
    element.className = 'clickable-square';
    document.body.appendChild(element);
    const result = element.getAnimations().map(animation => {
      const duration = animation.effect?.getTiming().duration;
      return typeof duration === 'number' ? duration : Number.POSITIVE_INFINITY;
    });
    element.remove();
    return result;
  });
  expect(durations.length).toBeGreaterThan(0);
  expect(durations.every(duration => duration <= 1)).toBe(true);
});

test.describe('offline service worker', () => {
  test('precaches the required shell and reloads while offline', async ({ page, context }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', request => failedRequests.push(new URL(request.url()).pathname));
    await page.goto('/');
    await waitForActiveServiceWorker(page);

    const cachedShell = await page.evaluate(async () => {
      const cacheNames = (await caches.keys()).filter(name => name.startsWith('royal-game-of-ur-'));
      const cachedRequests = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name);
          return Promise.all((await cache.keys()).map(request => new URL(request.url).pathname));
        })
      );
      return cachedRequests.flat();
    });

    expect(cachedShell).toEqual(expect.arrayContaining(['/', '/offline', '/manifest.json']));

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      expect(failedRequests).toEqual([]);
      await expect(page.getByRole('heading', { level: 1, name: 'Royal Game of Ur' })).toBeVisible();
      await expect(page.getByTestId('ai-model-selection')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('applies an updated worker and reloads under its control', async ({ page, context }) => {
    const workerSource = await readFile(resolve('out/client/sw.js'), 'utf8');
    const updatedWorkerSource = `${workerSource}\nself.addEventListener('message', event => {
  if (event.data?.type === 'E2E_VERSION') event.ports[0]?.postMessage('updated');
});`;

    await page.goto('/');
    await waitForActiveServiceWorker(page);

    await context.route('**/sw-update.js', route =>
      route.fulfill({
        body: updatedWorkerSource,
        contentType: 'application/javascript',
        headers: { 'Cache-Control': 'no-store' },
      })
    );

    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw-update.js', { scope: '/' });
    });

    const updatePrompt = page.getByRole('status');
    await expect(updatePrompt).toContainText('Update ready');
    await expect(updatePrompt).toContainText('A newer version is ready to use.');
    await expect(page.getByRole('button', { name: 'Update' })).toBeVisible();
    await page.getByRole('button', { name: 'Later' }).click();
    await expect(updatePrompt).toBeHidden();

    await page.reload();
    await expect(updatePrompt).toContainText('Update ready');

    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Update' }).click(),
    ]);
    await waitForActiveServiceWorker(page);

    const activeVersion = await page.evaluate(async () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return null;

      return new Promise<string>((resolveVersion, reject) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(
          () => reject(new Error('Worker did not respond')),
          2_000
        );

        channel.port1.onmessage = event => {
          window.clearTimeout(timeout);
          resolveVersion(String(event.data));
        };
        controller.postMessage({ type: 'E2E_VERSION' }, [channel.port2]);
      });
    });

    expect(activeVersion).toBe('updated');
    await expect(page.getByRole('heading', { level: 1, name: 'Royal Game of Ur' })).toBeVisible();
  });
});
