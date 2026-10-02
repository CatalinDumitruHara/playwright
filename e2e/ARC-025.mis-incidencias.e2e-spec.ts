import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-025 — Mis incidencias. EP-027 listado + catálogos EP-040/EP-042 con stub local. */
const incidents = {
  items: [
    {
      incident_id: '5',
      reference_code: 'INC-2026-000005',
      room_name: 'Sala Goya',
      office_name: 'Madrid',
      category_name: 'Mobiliario',
      description: 'Silla rota en sala',
      status_code: 'ABIERTA',
      created_at: '2026-09-01T10:00:00Z',
    },
  ],
  total: 1,
};

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
  await page.route('**/api/my-incidents*', (route) => route.fulfill(json(incidents)));
}

test.describe('@smoke @screen:ARC-025 mis incidencias', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'EMPLEADO');
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/mis-incidencias', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Mis incidencias' })).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('lista la incidencia devuelta por el API', async ({ page }) => {
    await stubApi(page);
    await page.goto('/mis-incidencias', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    const rows = page.locator('[data-testid="incident-row"]');
    await expect(rows).toHaveCount(1, { timeout: 15_000 });
    await expect(rows.first()).toContainText('INC-2026-000005');
  });
});
