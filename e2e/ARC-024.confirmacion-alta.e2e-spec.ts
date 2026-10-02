import { test, expect } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-024 — Confirmación del alta. Sin estado de navegación muestra el aviso y "registrar otra". */
test.describe('@smoke @screen:ARC-024 confirmación del alta', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'EMPLEADO');
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/incidencias/nueva/confirmacion', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Confirmación del alta' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('sin incidencia en el estado ofrece registrar otra', async ({ page }) => {
    await page.goto('/incidencias/nueva/confirmacion', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="no-incident"]')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('[data-testid="register-another"]')).toBeVisible();
  });
});
