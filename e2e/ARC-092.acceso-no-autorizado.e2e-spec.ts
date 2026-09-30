import { test, expect } from '@playwright/test';
import { ensureEnvironment } from './mind-env';
import { mockSession } from './shell-session';

/** ARC-092 · Acceso no autorizado (/acceso-no-autorizado) — FLOW-028 SCR-003. */
test.describe('@smoke @functional @screen:SCR-003 Acceso no autorizado', () => {
  test('muestra ruta solicitada y rol vigente y vuelve a la pantalla inicial', async ({ page }) => {
    await mockSession(page, 'EMPLEADO');
    await page.goto('/acceso-no-autorizado?ruta=%2Fusuarios');
    await ensureEnvironment(page);
    await expect(page.getByTestId('unauthorized-message')).toBeAttached();
    await expect(page.getByTestId('requested-path')).toHaveText('/usuarios');
    await expect(page.getByTestId('current-role')).toHaveText('Empleado');
    await page.getByTestId('back-home').click();
    await expect(page).toHaveURL(/\/inicio$/);
  });
});
