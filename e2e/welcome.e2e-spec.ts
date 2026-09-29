import { test, expect } from '@playwright/test';

/**
 * @smoke — app boots and the default route mounts without a fatal page error.
 * Platform runs this when PlaywrightTriggerPolicy selects smoke/functional in-session.
 *
 * Prefer `app-root` over `body` visibility: Angular/Ionic may leave `body` with CSS
 * that fails Playwright's "visible" heuristic even when the shell has mounted.
 */
test.describe('@smoke welcome shell', () => {
  test('home loads without pageerror', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/acceso/credencial-caducada', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Credencial caducada', { timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });
});
