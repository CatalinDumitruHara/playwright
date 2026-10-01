import { test, expect, type Page } from '@playwright/test';

/** ARC-095 — Incidencia no encontrada. Muestra el id solicitado y vuelta a mis incidencias. */
const session = {
  token: 't',
  must_change_password: false,
  user: {
    name: 'Ana Pérez',
    email: 'ana.perez@empresa.com',
    role: 'ROL-001',
    status: 'ACTIVA',
    password_last_updated: '2026-01-01T10:00:00Z',
  },
};

async function stubSession(page: Page) {
  await page.route('**/api/auth/sessions/current', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) })
  );
}

test.describe('@smoke @screen:ARC-095 incidencia no encontrada', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubSession(page);
    await page.goto('/incidencias/no-encontrada?id=99', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Incidencia no encontrada' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el id solicitado y el botón de volver a mis incidencias', async ({ page }) => {
    await stubSession(page);
    await page.goto('/incidencias/no-encontrada?id=99', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="back-mine"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="requested-id"]')).toHaveText('99');
  });
});
