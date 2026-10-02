import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-023 — Alta de incidencia. Catálogos EP-040 (categorías) y EP-042 (salas) con stub local. */
function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/incident-categories*', (route) =>
    route.fulfill(json({ items: [{ category_code: 'MOBILIARIO', category_name: 'Mobiliario' }] }))
  );
  await page.route('**/api/rooms*', (route) =>
    route.fulfill(
      json({ items: [{ room_id: 1, room_name: 'Sala Goya', office_id: 1, office_name: 'Madrid' }] })
    )
  );
  // POST /incidents: JSON o multipart; el stub no mira el content-type ni el cuerpo.
  await page.route('**/api/incidents', (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ incident_id: '5', reference_code: 'INC-2026-000005', status_code: 'ABIERTA' }),
    });
  });
}

test.describe('@smoke @screen:ARC-023 alta de incidencia', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'EMPLEADO');
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias/nueva', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Nueva incidencia' })).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el botón de registrar la incidencia y no hay error de catálogos', async ({ page }) => {
    await stubApi(page);
    await page.goto('/incidencias/nueva', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="submit-incident"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="catalog-error"]')).toHaveCount(0);
  });
});
