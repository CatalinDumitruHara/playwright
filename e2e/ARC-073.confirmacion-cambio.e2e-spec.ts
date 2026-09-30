import { test, expect, type Page } from '@playwright/test';

/** ARC-073 — Confirmación de cambio de contraseña. authGuard consume EP-003 (stub local). */
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

test.describe('@smoke @screen:ARC-073 confirmación de cambio de contraseña', () => {
  // Salta el selector de entorno de ngx-multienvironment (igual que el smoke de la plataforma: 'dev').
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubSession(page);
    await page.goto('/mi-perfil/contrasena/confirmacion', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Contraseña actualizada' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el éxito, la fecha del cambio y vuelve a Mi perfil', async ({ page }) => {
    await stubSession(page);
    await page.goto('/mi-perfil/contrasena/confirmacion', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="success-message"]')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('[data-testid="sessions-revoked"]')).toBeAttached();
    await expect(page.locator('[data-testid="change-datetime"]')).toHaveText(
      /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/
    );
    await page.locator('[data-testid="back-to-profile"]').click();
    await expect(page).toHaveURL(/\/mi-perfil$/);
  });
});
