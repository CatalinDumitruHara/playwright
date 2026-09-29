import { test, expect } from '@playwright/test';

/**
 * @functional — placeholder interaction check for the welcome screen.
 * Agents extend this file (or add sibling *.e2e-spec.ts) per screen_codes / DoD.
 */
test.describe('@functional welcome', () => {
  test('welcome page exposes main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Soft presence: archetype welcome page should render something beyond empty body.
    const text = (await page.locator('body').innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
  });
});
