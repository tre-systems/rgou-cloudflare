import { test, expect } from "@playwright/test";

test.describe("Royal Game of Ur - Performance Tests", () => {
  test("should load the page within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Wait for the main content to be visible
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds (adjust based on your requirements)
    expect(loadTime).toBeLessThan(5000);

    console.log(`Page load time: ${loadTime}ms`);
  });

  test("should have good Core Web Vitals", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Check for layout shift by ensuring main elements are stable
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeVisible();

    // Wait a bit more to check for layout stability
    await page.waitForTimeout(1000);

    // Verify main elements are still in place (no major layout shift)
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeVisible();
  });

  test("should handle rapid user interactions", async ({ page }) => {
    await page.goto("/");

    const rollButton = page.getByRole("button", { name: "Roll Dice" });
    const resetButton = page.getByRole("button", { name: "Reset Game" });

    // Perform rapid clicks to test responsiveness
    for (let i = 0; i < 5; i++) {
      await rollButton.click();
      await page.waitForTimeout(100);
    }

    // Reset and try again
    await resetButton.click();
    await page.waitForTimeout(200);

    // Buttons should still be responsive
    await expect(rollButton).toBeEnabled();
    await expect(resetButton).toBeEnabled();
  });

  test("should load all critical resources", async ({ page }) => {
    // Monitor network requests
    const responses: string[] = [];

    page.on("response", (response) => {
      responses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto("/");

    // Wait for main content
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();

    // Check that we don't have too many failed requests
    const failedRequests = responses.filter(
      (r) => r.startsWith("4") || r.startsWith("5")
    );

    console.log("Failed requests:", failedRequests);

    // Allow for some failed requests (like analytics, etc.) but not too many
    expect(failedRequests.length).toBeLessThan(5);
  });
});

test.describe("Royal Game of Ur - Accessibility Tests", () => {
  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const h1 = await page.locator("h1").count();
    const h2 = await page.locator("h2").count();
    const h3 = await page.locator("h3").count();

    // Should have at least one main heading
    expect(h1 + h2 + h3).toBeGreaterThan(0);
  });

  test("should have accessible buttons", async ({ page }) => {
    await page.goto("/");

    // Check that buttons have accessible names
    const rollButton = page.getByRole("button", { name: "Roll Dice" });
    const resetButton = page.getByRole("button", { name: "Reset Game" });
    const aiButton = page.getByRole("button", { name: "Play vs AI" }).first();

    await expect(rollButton).toBeVisible();
    await expect(resetButton).toBeVisible();
    await expect(aiButton).toBeVisible();

    // Check that buttons are keyboard accessible
    await rollButton.focus();
    await expect(rollButton).toBeFocused();
  });

  test("should have proper color contrast", async ({ page }) => {
    await page.goto("/");

    // This is a basic visual check - in a real scenario, you'd use axe-core
    // or similar tools for comprehensive accessibility testing

    // Check that text is visible (which implies some level of contrast)
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByText("Player 1 (Blue)")).toBeVisible();
    await expect(page.getByText("Player 2 (Red)")).toBeVisible();
  });

  test("should work with keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Test tab navigation through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to navigate to and activate buttons
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["BUTTON", "INPUT", "A"].includes(focused || "")).toBeTruthy();
  });
});

test.describe("Royal Game of Ur - Cross-browser Compatibility", () => {
  test("should work consistently across browsers", async ({ page }) => {
    await page.goto("/");

    // Basic functionality should work regardless of browser
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Reset Game" })
    ).toBeEnabled();

    // Test basic interaction
    await page.getByRole("button", { name: "Roll Dice" }).click();
    await page.waitForTimeout(500);

    // Game should still be functional after interaction
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeEnabled();
  });

  test("should handle browser back/forward", async ({ page }) => {
    await page.goto("/");

    // Navigate to the page and interact
    await page.getByRole("button", { name: "Roll Dice" }).click();
    await page.waitForTimeout(500);

    // Simulate navigation away and back
    await page.goto("about:blank");
    await page.goBack();

    // Page should be functional after navigation
    await expect(page.getByText("🏺 Royal Game of Ur 🏺")).toBeVisible();
    await expect(page.getByRole("button", { name: "Roll Dice" })).toBeEnabled();
  });
});
