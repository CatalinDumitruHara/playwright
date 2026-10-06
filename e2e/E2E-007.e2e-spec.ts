import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/**
 * E2E-007 — Un técnico cierra una incidencia resuelta (EP-035).
 * El WireMock del entorno responde cuerpos vacíos: el contrato se fija desde el test.
 */
const COMMENT = 'Se sustituyó el compresor del equipo de climatización y se verificó el funcionamiento.';

const resolved = {
  incident_id: '7',
  reference_code: 'INC-2026-000007',
  room_name: 'Sala Goya',
  office_name: 'Madrid',
  category_name: 'Climatización',
  description: 'No enfría',
  status_code: 'RESUELTA',
  assigned_technician_name: 'Ana Pérez Gil',
};

function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

test("Dado un técnico, cuando cierra una incidencia resuelta con comentario, entonces el estado final es 'Cerrada'", { tag: '@E2E-007' }, async ({ page }) => {
  let closed: Record<string, unknown> | null = null;
  const closurePosts: Array<Record<string, unknown>> = [];

  await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  await mockSession(page, 'TECNICO_MANTENIMIENTO', 'Ana Pérez Gil');
  await stubApi(page);

  await test.step('Given un técnico autenticado viendo el detalle de una incidencia resuelta que tiene asignada', async () => {
    await page.goto('/incidencias/7/cierres-similares', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(page.locator('[data-testid="similar-current-status"]')).toContainText('Resuelta', {
      timeout: 15_000,
    });
  });

  await test.step('When abre el diálogo de cierre, escribe un comentario de resolución y confirma', async () => {
    await page.locator('[data-testid="similar-close-action"]').click();
    await expect(page).toHaveURL(/\/incidencias\/7\/cerrar$/);
    await page.locator('[data-testid="close-comment"]').fill(COMMENT);
    await page.locator('[data-testid="close-confirm"]').click();
  });

  await test.step("Then la incidencia cambia su estado a 'Cerrada' y el comentario es visible", async () => {
    await expect(page).toHaveURL(/\/incidencias\/7\/resolucion/, { timeout: 15_000 });
    await expect(page.locator('[data-testid="resolution-status"]')).toContainText('Cerrada');
    await expect(page.locator('[data-testid="resolution-comment"]')).toContainText(COMMENT);
    await expect(page.locator('[data-testid="resolution-closed-by"]')).toHaveText('Ana Pérez Gil');
    await expect(page.locator('[data-testid="resolution-closed-at"]')).toContainText('06/10/2026');
    expect(closurePosts).toHaveLength(1);
    expect(closurePosts[0].resolution_comment).toBe(COMMENT);
  });

  async function stubApi(p: Page): Promise<void> {
    await p.route(
      (url) => url.pathname.endsWith('/api/incidents/7'),
      (route) => route.fulfill(json(closed ?? resolved))
    );
    await p.route(
      (url) => url.pathname.endsWith('/api/incidents/7/similar-closures'),
      (route) => route.fulfill(json({ items: [], total: 0 }))
    );
    await p.route(
      (url) => url.pathname.endsWith('/api/incidents/7/closure'),
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.fallback();
          return;
        }
        const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
        closurePosts.push(body);
        closed = {
          ...resolved,
          status_code: 'CERRADA',
          resolution_comment: body.resolution_comment,
          closed_by_name: 'Ana Pérez Gil',
          closed_at: '2026-10-06T10:30:00Z',
        };
        await route.fulfill(json(closed, 201));
      }
    );
  }
});
