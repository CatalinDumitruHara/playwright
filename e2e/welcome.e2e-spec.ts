import { test, expect } from '@playwright/test';

/**
 * @smoke — app boots and the default route renders without a fatal page error.
 * Platform runs this when PlaywrightTriggerPolicy selects smoke/functional in-session.
 */
test.describe('@smoke welcome shell', () => {
  test('home loads without pageerror', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });
});
