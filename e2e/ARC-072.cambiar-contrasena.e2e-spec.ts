import { test, expect, type Page } from '@playwright/test';

/** ARC-072 — Cambiar contraseña. authGuard consume EP-003 (stub local). */
async function stubSession(page: Page) {
  await page.route('**/api/auth/sessions/current', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 't',
        must_change_password: false,
        user: {
          name: 'Ana Pérez',
          email: 'ana.perez@empresa.com',
          role: 'ROL-001',
          status: 'ACTIVA',
          password_last_updated: '2026-01-01T10:00:00Z',
        },
      }),
    })
  );
}

test.describe('@smoke @screen:ARC-072 cambiar contraseña', () => {
  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubSession(page);
    await page.goto('/mi-perfil/contrasena', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Cambiar contraseña' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra la política, los tres campos y las acciones', async ({ page }) => {
    await stubSession(page);
    await page.goto('/mi-perfil/contrasena', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="password-policy"]')).toBeAttached({ timeout: 15_000 });
    await expect(
      page.locator('[data-testid="change-password-form"] b2b-password-field')
    ).toHaveCount(3);
    await expect(page.locator('[data-testid="change-password-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();
  });
});
