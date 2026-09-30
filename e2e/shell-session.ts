import type { Page } from '@playwright/test';

/**
 * Helpers de sesión para los e2e del shell (TSK-032).
 * El contexto de usuario (EP-003 GET /auth/sessions/current) se sirve con
 * page.route desde el propio test: el stub del contrato responde con cuerpo
 * vacío y el shell trata una sesión sin rol como inválida (REQ-010).
 */
export type E2eRole = 'EMPLEADO' | 'TECNICO_MANTENIMIENTO' | 'ADMINISTRADOR';

export async function mockSession(page: Page, role: E2eRole, fullName = 'Ana Pérez Gil'): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('sessionToken', 'e2e-token'));
  await page.route('**/auth/sessions/current', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: 'u-e2e',
        full_name: fullName,
        email: 'ana.perez@mapfre.com',
        role_code: role,
      }),
    });
  });
}

export async function mockNoSession(page: Page): Promise<void> {
  await page.route('**/auth/sessions/current', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
  );
}
