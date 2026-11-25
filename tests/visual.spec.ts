import { expect, test } from "@playwright/test";
import { routes } from "./routes";

/**
 * Screenshot of the first screen of each page at each size. Live WebGL and canvas effects are
 * hidden and the clock and cursor masked, because they change every frame.
 */
for (const path of routes) {
  test(`${path} looks right`, async ({ page }) => {
    // Keep the hero on its poster image: the live globe and stars differ every frame.
    await page.route("**/hero-worker.js", (r) => r.abort());
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    // Hide the live effects (they change every frame) and keep the real "runway" word showing.
    await page.addStyleTag({
      content: `canvas { visibility: hidden !important; }
        [class*="heroWordLive"] { color: inherit !important; }`,
    });
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot({
      mask: [page.locator("[data-clock]"), page.locator(".target-cursor-wrapper")],
    });
  });
}
