import { test, expect } from '@playwright/test';

/** ARC-076 — Cuenta bloqueada temporalmente. */
test.describe('@smoke @screen:ARC-076 cuenta bloqueada', () => {
  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/acceso/cuenta-bloqueada', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Cuenta bloqueada temporalmente', {
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el aviso de bloqueo, el formulario de reintento y la info al administrador', async ({
    page,
  }) => {
    await page.goto('/acceso/cuenta-bloqueada', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="lock-notice"]')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('[data-testid="locked-login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="locked-login-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="lock-admin-info"]')).toBeAttached();
  });
});
