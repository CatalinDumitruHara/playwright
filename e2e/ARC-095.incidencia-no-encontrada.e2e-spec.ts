import { test, expect } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-095 — Incidencia no encontrada. Muestra el id solicitado y vuelta a mis incidencias. */
test.describe('@smoke @screen:ARC-095 incidencia no encontrada', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'EMPLEADO');
    await page.route('**/api/my-incidents*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      })
    );
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/incidencias/no-encontrada?id=99', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Incidencia no encontrada' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el id solicitado y el botón de volver a mis incidencias', async ({ page }) => {
    await page.goto('/incidencias/no-encontrada?id=99', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="back-mine"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="requested-id"]')).toHaveText('99');
  });

  test('«Volver a mis incidencias» navega a /incidencias/mias', async ({ page }) => {
    await page.goto('/incidencias/no-encontrada?id=99', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await page.locator('[data-testid="back-mine"]').click({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/incidencias\/mias(\?|$)/, { timeout: 15_000 });
  });
});
