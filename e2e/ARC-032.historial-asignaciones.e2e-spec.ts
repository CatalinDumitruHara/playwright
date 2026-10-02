import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-032 — Historial de asignaciones de la incidencia. EP-029 historial con stub local. */
const history = {
  items: [
    {
      entry_type: 'ASIGNACION',
      from_technician_name: null,
      to_technician_name: 'Luis Gómez',
      actor_name: 'Luis Gómez',
      changed_at: '2026-09-02T09:00:00Z',
    },
  ],
};

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/incidents/7/history*', (route) => route.fulfill(json(history)));
}

test.describe('@smoke @screen:ARC-032 historial de asignaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'TECNICO_MANTENIMIENTO');
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias/7/historial/asignaciones', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Historial de la incidencia' })).toBeVisible({
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra la entrada de asignación del historial', async ({ page }) => {
    await stubApi(page);
    await page.goto('/incidencias/7/historial/asignaciones', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="ah-entry"]')).toHaveCount(1, { timeout: 15_000 });
  });
});
