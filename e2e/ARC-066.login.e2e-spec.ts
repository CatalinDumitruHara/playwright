import { test, expect } from '@playwright/test';

/** ARC-066 — Acceso (login). Consume EP-001 POST /auth/sessions (stub local). */
test.describe('@smoke @screen:ARC-066 acceso', () => {
  // Salta el selector de entorno de ngx-multienvironment (igual que el smoke de la plataforma: 'dev').
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('carga /acceso sin pageerror y muestra el título', async ({ page }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/acceso', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('h1')).toHaveText('Acceso', { timeout: 15_000 });
    expect(errors, `pageerrors: ${errors.join('; ')}`).toEqual([]);
  });

  test('credenciales incorrectas (401) muestran el error', async ({ page }) => {
    await page.route('**/api/auth/sessions', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/acceso', { waitUntil: 'domcontentloaded' });
    await page.locator('#username').fill('usuario@empresa.com');
    await page.locator('b2b-password-field input').first().fill('Incorrecta123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      'Usuario o contraseña incorrectos'
    );
  });

  test('must_change_password redirige a cambio obligatorio', async ({ page }) => {
    await page.route('**/api/auth/sessions', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 't',
          must_change_password: true,
          user: {
            name: 'Ana Pérez',
            email: 'ana.perez@empresa.com',
            role: 'ROL-001',
            status: 'ACTIVA',
            password_last_updated: '2026-01-01T10:00:00Z',
          },
        }),
      })
    );
    await page.goto('/acceso', { waitUntil: 'domcontentloaded' });
    await page.locator('#username').fill('ana.perez@empresa.com');
    await page.locator('b2b-password-field input').first().fill('Temporal123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page).toHaveURL(/\/acceso\/cambio-obligatorio-contrasena$/);
  });
});
