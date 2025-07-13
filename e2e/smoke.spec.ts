import { test, expect } from '@playwright/test';

test.describe('Game Smoke Tests', () => {
  test('loads main page and shows key elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
    await expect(page.getByTestId('help-button')).toBeVisible();
    await expect(page.getByTestId('roll-dice')).toBeVisible();
  });

  test('can toggle sound', async ({ page }) => {
    await page.goto('/');
    const soundToggle = page.getByTestId('sound-toggle');
    await soundToggle.click();
  });

  test('can open and close help panel', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('help-button').click();
    await expect(page.locator('text=How to Play')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('help-close').click();
    await expect(page.locator('text=How to Play')).not.toBeVisible({ timeout: 5000 });
  });

  test('can roll dice', async ({ page }) => {
    await page.goto('/');
    const rollDiceButton = page.getByTestId('roll-dice');
    await expect(rollDiceButton).toBeVisible();
    await rollDiceButton.click();
  });

  test('game board squares are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('square-0')).toBeVisible();
    await expect(page.getByTestId('square-1')).toBeVisible();
  });

  test('can interact with game board', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('game-board')).toBeVisible();

    const rollDiceButton = page.getByTestId('roll-dice');
    await expect(rollDiceButton).toBeVisible();
    await rollDiceButton.click();

    await page.waitForTimeout(1000);

    const squares = page.locator('[data-testid^="square-"]');
    await expect(squares.first()).toBeVisible();
  });
});
