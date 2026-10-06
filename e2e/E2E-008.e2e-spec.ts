import { test, expect, type Page } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/**
 * E2E-008 — Un técnico intenta cerrar una incidencia resuelta sin comentario (EP-035).
 * El WireMock del entorno responde cuerpos vacíos: el contrato se fija desde el test.
 */
const resolved = {
  incident_id: '8',
  reference_code: 'INC-2026-000008',
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

test("Dado un técnico, cuando intenta cerrar una incidencia sin comentario, entonces el sistema lo impide", { tag: '@E2E-008' }, async ({ page }) => {
  let closurePosts = 0;

  await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  await mockSession(page, 'TECNICO_MANTENIMIENTO', 'Ana Pérez Gil');
  await stubApi(page);

  const comment = page.locator('[data-testid="close-comment"]');
  const confirm = page.locator('[data-testid="close-confirm"]');

  await test.step('Given un técnico autenticado en el diálogo de cierre de una incidencia resuelta', async () => {
    await page.goto('/incidencias/8/cerrar', { waitUntil: 'domcontentloaded' });
    await ensureEnvironment(page);
    await expect(comment).toBeVisible({ timeout: 15_000 });
  });

  await test.step('When intenta confirmar sin escribir un comentario de resolución', async () => {
    await comment.fill('   ');
    await comment.blur();
    await expect(confirm).toBeDisabled();
    await confirm.dispatchEvent('click');
  });

  await test.step('Then el sistema muestra un mensaje de error y la incidencia no se cierra', async () => {
    await expect(page.locator('[data-testid="close-comment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="close-comment-error"]')).toContainText(
      'Debe indicar un comentario de resolución para cerrar la incidencia'
    );
    expect(closurePosts).toBe(0);
    await expect(page).toHaveURL(/\/incidencias\/8\/cerrar$/);
  });

  async function stubApi(p: Page): Promise<void> {
    await p.route(
      (url) => url.pathname.endsWith('/api/incidents/8'),
      (route) => route.fulfill(json(resolved))
    );
    await p.route(
      (url) => url.pathname.endsWith('/api/incidents/8/closure'),
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.fallback();
          return;
        }
        closurePosts += 1;
        await route.fulfill(
          json({ code: 'VALIDATION_ERROR', message: 'Debe indicar un comentario de resolución para cerrar la incidencia' }, 400)
        );
      }
    );
  }
});
