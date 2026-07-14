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
  await expect(page.getByRole('heading', { level: 2, name: 'Select Your Opponent' })).toBeVisible();

  const classicMode = page.getByRole('button', { name: /^Classic AI/ });
  await expect(classicMode).toBeVisible();
  await expect(page.getByRole('button', { name: /^Machine Learning AI/ })).toBeVisible();
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
  await expect(page.getByRole('button', { name: 'Choose another opponent' })).toBeVisible();
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

  test('installs an updated worker and exposes the update prompt', async ({ page, context }) => {
    const workerSource = await readFile(resolve('out/client/sw.js'), 'utf8');

    await page.goto('/');
    await waitForActiveServiceWorker(page);

    await context.route('**/sw-update.js', route =>
      route.fulfill({
        body: `${workerSource}\n// e2e update`,
        contentType: 'application/javascript',
        headers: { 'Cache-Control': 'no-store' },
      })
    );

    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw-update.js', { scope: '/' });
    });

    const updatePrompt = page.getByRole('status');
    await expect(updatePrompt).toContainText('A new version is available.');
    await expect(page.getByRole('button', { name: 'Update now' })).toBeVisible();
    await page.getByRole('button', { name: 'Later' }).click();
    await expect(updatePrompt).toBeHidden();
  });
});
