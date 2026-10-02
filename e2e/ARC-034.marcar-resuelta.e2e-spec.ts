import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-034 — Marcar la incidencia como resuelta. EP-028 detalle con stub local. */
const incident = {
  incident_id: '7',
  incident_code: 'INC-2026-000007',
  room_name: 'Sala Goya',
  office_name: 'Madrid',
  category_name: 'Mobiliario',
  status: 'EN_CURSO',
  created_at: '2026-09-01T10:00:00Z',
  reporter_name: 'Ana Pérez',
  assignment_status: 'ASIGNADA',
  assigned_technician_id: '42',
  assigned_technician_name: 'Luis Gómez',
  available_transitions: [
    { to_status: 'RESUELTA', label: 'Marcar como resuelta', requires_comment: false, blocked_reason: null },
  ],
};

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/incidents/7', (route) => route.fulfill(json(incident)));
}

test.describe('@smoke @screen:ARC-034 marcar como resuelta', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'TECNICO_MANTENIMIENTO');
  });

  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias/7/resolver', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(
      page.locator('h1', { hasText: 'Marcar la incidencia como resuelta' })
    ).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra el resumen con el estado destino «Resuelta» y la nota', async ({ page }) => {
    await stubApi(page);
    await page.goto('/incidencias/7/resolver', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="summary-code"]')).toHaveText('INC-2026-000007', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="summary-target-status"]')).toHaveText('Resuelta');
    await expect(page.locator('[data-testid="note-input"]')).toBeVisible();
  });
});
