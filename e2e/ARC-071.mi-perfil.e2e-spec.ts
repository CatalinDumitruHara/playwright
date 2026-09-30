import { test, expect, type Page } from '@playwright/test';

/** ARC-071 — Mi perfil. authGuard consume EP-003 GET /auth/sessions/current (stub local). */
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

async function stubSession(page: Page) {
  await page.route('**/api/auth/sessions/current', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) })
  );
}

test.describe('@smoke @screen:ARC-071 mi perfil', () => {
  test('carga sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await stubSession(page);
    await page.goto('/mi-perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1', { hasText: 'Mi perfil' })).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('muestra nombre y correo de la sesión', async ({ page }) => {
    await stubSession(page);
    await page.goto('/mi-perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="profile-name"]')).toHaveText(session.user.name, {
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="profile-email"]')).toHaveText(session.user.email);
  });
});
