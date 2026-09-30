import { test, expect } from '@playwright/test';

/** ARC-068 — Credencial temporal caducada. */
test.describe('@smoke @screen:ARC-068 credencial caducada', () => {
  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/acceso/credencial-caducada', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Credencial temporal caducada', {
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el aviso y vuelve al formulario de acceso', async ({ page }) => {
    await page.goto('/acceso/credencial-caducada', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="notification"]')).toBeAttached({ timeout: 15_000 });
    await page.locator('[data-testid="back-to-login"]').click();
    await expect(page).toHaveURL(/\/acceso$/);
  });
});
