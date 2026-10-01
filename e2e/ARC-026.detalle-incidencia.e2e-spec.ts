import { test, expect, type Page } from '@playwright/test';

/** ARC-026 — Detalle de incidencia. EP-028 detalle + EP-029 historial con stub local. */
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

const incident = {
  incident_id: '5',
  reference_code: 'INC-2026-000005',
  room_name: 'Sala Goya',
  office_name: 'Madrid',
  category_name: 'Mobiliario',
  description: 'Silla rota en sala',
  status_code: 'ABIERTA',
  created_at: '2026-09-01T10:00:00Z',
};

const history = {
  items: [
    {
      from_status: null,
      to_status: 'ABIERTA',
      actor_name: 'Ana Pérez',
      changed_at: '2026-09-01T10:00:00Z',
    },
  ],
};

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/auth/sessions/current', (route) => route.fulfill(json(session)));
  await page.route('**/api/incidents/5', (route) => route.fulfill(json(incident)));
  await page.route('**/api/incidents/5/history*', (route) => route.fulfill(json(history)));
}

test.describe('@smoke @screen:ARC-026 detalle de incidencia', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/mis-incidencias/5', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Detalle de la incidencia' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el código de referencia de la incidencia', async ({ page }) => {
    await stubApi(page);
    await page.goto('/mis-incidencias/5', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="detail-reference"]')).toHaveText('INC-2026-000005', {
      timeout: 15_000,
    });
  });
});
