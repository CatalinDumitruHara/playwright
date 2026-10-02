import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-028 — Bandeja de incidencias (técnico). EP-026 listado + catálogos con stub local. */
const trayPage = {
  items: [
    {
      incident_id: '7',
      incident_code: 'INC-2026-000007',
      room_name: 'Sala Goya',
      office_name: 'Madrid',
      category_name: 'Mobiliario',
      status: 'ABIERTA',
      created_at: '2026-09-01T10:00:00Z',
      age_days: 3,
      reporter_name: 'Ana Pérez',
      assigned_technician_name: null,
      has_photo: false,
    },
  ],
  total_count: 1,
  page: 1,
  page_size: 25,
  total_pages: 1,
};

const categories = { items: [{ category_code: 'MOBILIARIO', category_name: 'Mobiliario', is_active: true }] };
const rooms = {
  items: [{ room_id: 1, room_name: 'Sala Goya', office_id: 1, office_name: 'Madrid', is_active: true }],
};

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/incident-categories*', (route) => route.fulfill(json(categories)));
  await page.route('**/api/rooms*', (route) => route.fulfill(json(rooms)));
  // EP-026: GET /api/incidents con o sin query string.
  await page.route(/\/api\/incidents(\?.*)?$/, (route) => route.fulfill(json(trayPage)));
}

test.describe('@smoke @screen:ARC-028 bandeja de incidencias', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'TECNICO_MANTENIMIENTO');
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Bandeja de incidencias' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra la incidencia sin técnico como «Sin asignar»', async ({ page }) => {
    await stubApi(page);
    await page.goto('/incidencias', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="tray-assignee"]').first()).toContainText('Sin asignar', {
      timeout: 15_000,
    });
  });
});
