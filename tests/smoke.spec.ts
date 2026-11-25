import { expect, test } from "@playwright/test";
import { routes } from "./routes";

for (const path of routes) {
  test(`${path} loads with one heading and no errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      // Speed Insights' script only exists on Vercel; locally it 404s.
      if (m.type() === "error" && !m.location().url.includes("/_vercel/"))
        errors.push(m.text());
    });
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("unknown pages show the 404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
});

test("home page works without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("runway");
  await expect(page.locator('img[src="/hero-globe.svg"]')).toBeVisible();
  await expect(page.locator("#about")).toBeVisible();
  await ctx.close();
});

test("flight board links to each flight log", async ({ page }) => {
  await page.goto("/flights");
  await page.locator('a[href="/flights/fd-104"]').first().click();
  await expect(page).toHaveURL(/\/flights\/fd-104$/);
  await expect(page.getByText("Flight log · FD-104", { exact: false })).toBeVisible();
});
