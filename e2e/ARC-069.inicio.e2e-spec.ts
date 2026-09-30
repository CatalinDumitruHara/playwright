import { test, expect } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockNoSession, mockSession } from './shell-session';

/** ARC-069 · Pantalla inicial del rol (/inicio) — FLOW-018 SCR-004, FLOW-019 SCR-002, FLOW-028 SCR-001. */
test.describe('@smoke @functional @screen:SCR-001 @screen:SCR-002 @screen:SCR-004 Pantalla inicial del rol', () => {
  test('muestra usuario, rol vigente, menú y accesos directos', async ({ page }) => {
    await mockSession(page, 'EMPLEADO');
    await page.goto('/inicio');
    await ensureEnvironment(page);
    await expect(page.getByTestId('header-user-name')).toHaveText('Ana Pérez Gil');
    await expect(page.getByTestId('header-user-role')).toContainText('Empleado');
    await expect(page.getByTestId('home-user-role')).toContainText('Empleado');
    await expect(page.locator('app-nav-menu b2b-sidebar-item').first()).toBeAttached();
    await expect(page.getByTestId('shortcut-/mi-perfil')).toBeVisible();
  });

  test('sin sesión válida redirige al acceso conservando la ruta pretendida', async ({ page }) => {
    await mockNoSession(page);
    await page.goto('/mi-perfil');
    await ensureEnvironment(page);
    await expect(page).toHaveURL(/\/acceso\?returnUrl=%2Fmi-perfil/);
  });

  test('cerrar sesión lleva a «Sesión finalizada»', async ({ page }) => {
    await mockSession(page, 'ADMINISTRADOR');
    await page.goto('/inicio');
    await ensureEnvironment(page);
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/acceso\/sesion-finalizada/);
  });
});
