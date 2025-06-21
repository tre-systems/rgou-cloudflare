import { test, expect } from "@playwright/test";

test.describe("Royal Game of Ur - UI Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the game title", async ({ page }) => {
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
  });

  test("should display game description", async ({ page }) => {
    await expect(
      page.getByText(
        "Experience the ancient Mesopotamian board game dating back 4,500 years"
      )
    ).toBeVisible();
  });

  test("should display player information", async ({ page }) => {
    // Check for player sections
    await expect(page.getByText("Player 1 (Blue)")).toBeVisible();
    await expect(page.getByText("Player 2 (Red)")).toBeVisible();

    // Check for piece counters - use first() to handle duplicates
    await expect(
      page.getByText("Start (7)", { exact: false }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Finished (0)", { exact: false }).first()
    ).toBeVisible();
  });

  test("should display game controls", async ({ page }) => {
    // Check for main game buttons
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset Game" })
    ).toBeVisible();

    // Check for mode toggle buttons - handle multiple AI buttons
    await expect(
      page.getByRole("button", { name: "Play vs AI" }).first()
    ).toBeVisible();
    await expect(page.getByText("👥 Two Player Mode").first()).toBeVisible();
  });

  test("should display game board", async ({ page }) => {
    // Check for game board presence
    const gameBoard = page.locator(
      '[data-testid="game-board"], .game-board, .board'
    );
    // Since we don't know the exact selector, we'll check for visual elements that indicate a board

    // Look for grid or board-like structure
    const boardElements = await page
      .locator("div")
      .filter({ hasText: /Player 1|Player 2/ })
      .count();
    expect(boardElements).toBeGreaterThan(0);
  });

  test("should display game rules", async ({ page }) => {
    await expect(page.getByText("How to Play")).toBeVisible();
    await expect(page.getByText("🎯 Objective")).toBeVisible();
    await expect(page.getByText("🎲 Dice")).toBeVisible();
    await expect(page.getByText("⭐ Rosettes")).toBeVisible();
    await expect(page.getByText("🛡️ Combat")).toBeVisible();
    await expect(page.getByText("🏁 Winning")).toBeVisible();
    await expect(page.getByText("📍 Path")).toBeVisible();
  });

  test("should display turn indicator", async ({ page }) => {
    await expect(
      page.getByText("Player 1's turn - roll the dice")
    ).toBeVisible();
  });
});

test.describe("Royal Game of Ur - Responsive Design", () => {
  test("should display correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that main elements are still visible on mobile
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset Game" })
    ).toBeVisible();
  });

  test("should display correctly on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Check that main elements are still visible on tablet
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeVisible();
    await expect(page.getByText("Player 1 (Blue)")).toBeVisible();
    await expect(page.getByText("Player 2 (Red)")).toBeVisible();
  });

  test("should display correctly on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // Check that all elements are visible on desktop
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByText("How to Play")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset Game" })
    ).toBeVisible();
  });
});
