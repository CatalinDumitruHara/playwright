import { test, expect } from '@playwright/test';

/** ARC-067 — Cambio obligatorio de contraseña. */
test.describe('@smoke @screen:ARC-067 cambio obligatorio de contraseña', () => {
  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/acceso/cambio-obligatorio-contrasena', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Cambio obligatorio de contraseña', {
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra los dos campos de contraseña y las acciones', async ({ page }) => {
    await page.goto('/acceso/cambio-obligatorio-contrasena', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('b2b-password-field')).toHaveCount(2, { timeout: 15_000 });
    await expect(page.locator('[data-testid="forced-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="forced-logout"]')).toBeVisible();
  });
});
