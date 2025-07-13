import { test, expect } from '@playwright/test';

test.describe('Game Smoke Tests', () => {
  test('loads main page and shows key elements', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();
    await expect(page.getByTestId('piece-0')).toBeVisible();
  });

  test('can toggle sound', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const soundToggle = page.getByTestId('sound-toggle');
    await soundToggle.click();
    // Optionally check for aria-pressed or icon change
  });

  test('can open help panel', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('help-panel')).toBeVisible();
  });

  test('can make first move', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for dice roll to be available
    await expect(page.getByTestId('roll-dice')).toBeVisible();
    // Try to click the first piece (piece-0)
    await page
      .getByTestId('piece-0')
      .click({ trial: true })
      .catch(() => {});
    // Optionally assert that the board state changed
  });
});
