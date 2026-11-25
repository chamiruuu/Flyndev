import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routes } from "./routes";

for (const path of routes) {
  test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    // Check final colours: show every scroll reveal and let entrance animations finish.
    await page.evaluate(async () => {
      document.querySelectorAll(".rv").forEach((el) => el.classList.add("in"));
      const finite = document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity);
      finite.forEach((a) => a.finish());
    });
    // Cast: @axe-core/playwright's Page type trails the installed Playwright by a version.
    const result = await new AxeBuilder({
      page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"],
    })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("canvas")
      .analyze();
    const summary = result.violations.map(
      (v) => `${v.id}: ${v.nodes.length} × ${v.help}`,
    );
    expect(summary).toEqual([]);
  });
}
