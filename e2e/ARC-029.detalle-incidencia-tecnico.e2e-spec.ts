import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-029 — Detalle técnico de la incidencia. EP-028 detalle con stub local. */
const incident = {
  incident_id: '7',
  incident_code: 'INC-2026-000007',
  room_name: 'Sala Goya',
  office_name: 'Madrid',
  category_name: 'Mobiliario',
  description: 'Silla rota en sala',
  status: 'ABIERTA',
  created_at: '2026-09-01T10:00:00Z',
  reporter_name: 'Ana Pérez',
  assigned_technician_name: null,
  assignment_status: 'SIN_ASIGNAR',
  has_photo: false,
  available_transitions: [
    {
      to_status: 'EN_CURSO',
      label: 'Iniciar atención',
      requires_comment: false,
      blocked_reason: 'La incidencia debe tener un técnico asignado',
    },
  ],
};

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function stubApi(page: Page) {
  await page.route('**/api/incidents/7', (route) => route.fulfill(json(incident)));
}

test.describe('@smoke @screen:ARC-029 detalle técnico de la incidencia', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
    await mockSession(page, 'TECNICO_MANTENIMIENTO');
  });

  test('carga sin pageerror y muestra el código de la incidencia', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubApi(page);
    await page.goto('/incidencias/7', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('[data-testid="detail-code"]')).toHaveText('INC-2026-000007', {
      timeout: 15_000,
    });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('sin técnico: pendiente de asignar, autoasignación visible y transición bloqueada', async ({
    page,
  }) => {
    await stubApi(page);
    await page.goto('/incidencias/7', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="detail-pending-assignment"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="action-self-assign"]')).toBeVisible();
    await expect(page.locator('[data-testid="transition-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="transition-blocked-reason"]')).toHaveText(
      'La incidencia debe tener un técnico asignado'
    );
  });
});
