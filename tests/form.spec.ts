import { expect, test } from "@playwright/test";

test("flight plan form validates, then hands over to email", async ({ page }) => {
  await page.goto("/radio");
  await page.getByRole("button", { name: "Send flight plan" }).click();
  await expect(page.getByText("Tell us who is flying.")).toBeVisible();
  await expect(page.locator('[name="name"]')).toBeFocused();

  await page.locator('[name="name"]').fill("Test Pilot");
  await page.locator('[name="email"]').fill("pilot@example.com");
  await page.getByRole("checkbox", { name: "Website" }).check();
  await page.getByRole("radio", { name: "Flexible" }).check();
  await page
    .locator('[name="message"]')
    .fill("A new site for our studio, live by spring.");
  await page.getByRole("button", { name: "Send flight plan" }).click();
  await expect(page.getByRole("status")).toContainText("Ready for takeoff");
});
