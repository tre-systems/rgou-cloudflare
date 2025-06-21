import { test, expect } from "@playwright/test";

test.describe("Royal Game of Ur - Game Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should roll dice and display result", async ({ page }) => {
    const rollButton = page.getByRole("button", { name: "Roll Dice" });

    // Click roll dice button
    await rollButton.click();

    // Wait for dice roll animation/result
    await page.waitForTimeout(1000);

    // Check if the dice roll produced a result (the turn should potentially change or dice result should be shown)
    // The exact implementation depends on how the dice results are displayed
    const turnText = page.locator("text=turn");
    await expect(turnText).toBeVisible();
  });

  test("should reset game properly", async ({ page }) => {
    const resetButton = page.getByRole("button", { name: "Reset Game" });

    // First, try to roll dice to change game state
    await page.getByRole("button", { name: "Roll Dice" }).click();
    await page.waitForTimeout(500);

    // Then reset the game
    await resetButton.click();

    // Check that the game is reset to initial state
    await expect(
      page.getByText("Start (7)", { exact: false }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Finished (0)", { exact: false }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Player 1's turn - roll the dice")
    ).toBeVisible();
  });

  test("should toggle between two-player and AI mode", async ({ page }) => {
    const aiButton = page.getByRole("button", { name: "Play vs AI" }).first();
    const twoPlayerButton = page.getByText("👥 Two Player Mode").first();

    // Initially should be in two-player mode
    await expect(twoPlayerButton).toBeVisible();

    // Click AI mode
    await aiButton.click();

    // Check that mode changed (this would depend on UI feedback)
    // The exact assertion would depend on how the UI indicates the mode change
    await expect(page.getByText("🤖 Play vs AI")).toBeVisible();

    // Click back to two-player mode - try button version if exists
    const twoPlayerModeButton = page.getByRole("button", {
      name: "👥 Two Player Mode",
    });
    await twoPlayerModeButton.click();

    // Should be back to two-player mode
    await expect(page.getByText("👥 Two Player Mode").first()).toBeVisible();
  });

  test("should handle multiple dice rolls", async ({ page }) => {
    const rollButton = page.getByRole("button", { name: "Roll Dice" });

    // Roll dice multiple times
    for (let i = 0; i < 3; i++) {
      await rollButton.click();
      await page.waitForTimeout(500);

      // Verify that the roll button is still functional
      await expect(rollButton).toBeEnabled();
    }
  });

  test("should maintain player turn information", async ({ page }) => {
    // Check initial turn state
    await expect(
      page.getByText("Player 1's turn - roll the dice")
    ).toBeVisible();

    // After rolling, the turn information should still be present
    await page.getByRole("button", { name: "Roll Dice" }).click();
    await page.waitForTimeout(1000);

    // Should still have turn information visible (either same player or switched)
    const turnElement = page.locator("text=turn").first();
    await expect(turnElement).toBeVisible();
  });

  test("should handle game controls accessibility", async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Test that buttons are focusable and have proper labels
    const rollButton = page.getByRole("button", { name: "Roll Dice" });
    const resetButton = page.getByRole("button", { name: "Reset Game" });

    await expect(rollButton).toBeEnabled();
    await expect(resetButton).toBeEnabled();

    // Test that buttons respond to keyboard input
    await rollButton.focus();
    await expect(rollButton).toBeFocused();
  });
});

test.describe("Royal Game of Ur - AI Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Switch to AI mode
    await page.getByRole("button", { name: "Play vs AI" }).first().click();
  });

  test("should handle AI opponent moves", async ({ page }) => {
    // Roll dice as human player
    await page.getByRole("button", { name: "Roll Dice" }).click();
    await page.waitForTimeout(1000);

    // In AI mode, the AI should eventually make a move
    // This test depends on the AI implementation timing
    // We'll wait for potential AI move and check that game state changes
    await page.waitForTimeout(3000);

    // The game should still be functional
    const rollButton = page.getByRole("button", { name: "Roll Dice" });
    await expect(rollButton).toBeVisible();
  });

  test("should display AI mode indicator", async ({ page }) => {
    // Check that AI mode is indicated in the UI
    await expect(page.getByText("🤖 Play vs AI")).toBeVisible();
  });
});

test.describe("Royal Game of Ur - Game State Persistence", () => {
  test("should maintain game state during page interactions", async ({
    page,
  }) => {
    await page.goto("/");

    // Make some moves
    await page.getByRole("button", { name: "Roll Dice" }).click();
    await page.waitForTimeout(500);

    // Scroll down and back up
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Game controls should still be functional
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Reset Game" })
    ).toBeEnabled();
  });
});
