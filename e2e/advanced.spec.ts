import { test, expect, Page } from '@playwright/test';

async function startGame(page: Page, mode = 'classic') {
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
