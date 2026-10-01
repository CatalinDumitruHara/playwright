import { test, expect, type Page } from '@playwright/test';

/** ARC-023 — Alta de incidencia. Catálogos EP-040 (categorías) y EP-042 (salas) con stub local. */
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

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/auth/sessions/current', (route) => route.fulfill(json(session)));
  await page.route('**/api/incident-categories*', (route) =>
    route.fulfill(json({ items: [{ category_code: 'MOBILIARIO', category_name: 'Mobiliario' }] }))
  );
  await page.route('**/api/rooms*', (route) =>
    route.fulfill(
      json({ items: [{ room_id: 1, room_name: 'Sala Goya', office_id: 1, office_name: 'Madrid' }] })
    )
  );
}

test.describe('@smoke @screen:ARC-023 alta de incidencia', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias/nueva', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Nueva incidencia' })).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el botón de registrar la incidencia y no hay error de catálogos', async ({ page }) => {
    await stubApi(page);
    await page.goto('/incidencias/nueva', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="submit-incident"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="catalog-error"]')).toHaveCount(0);
  });
});
