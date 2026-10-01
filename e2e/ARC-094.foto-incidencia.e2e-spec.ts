import { test, expect, type Page } from '@playwright/test';

/** ARC-094 — Foto adjunta. EP-030 sin contenido → aviso de foto vacía. */
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
  await page.route('**/api/incidents/5/photo*', (route) => route.fulfill(json({})));
}

test.describe('@smoke @screen:ARC-094 foto de incidencia', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias/5/foto', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Foto adjunta' })).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('sin contenido de foto muestra el aviso de foto vacía', async ({ page }) => {
    await stubApi(page);
    await page.goto('/incidencias/5/foto', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="photo-empty"]')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('[data-testid="photo-image"]')).toHaveCount(0);
  });
});
