import { test, expect } from '@playwright/test';
import { ensureEnvironment } from './mind-env';

/** ARC-070 · Sesión finalizada (/acceso/sesion-finalizada) — FLOW-019 SCR-003. */
test.describe('@smoke @functional @screen:SCR-003 Sesión finalizada', () => {
  test('informa de la finalización y vuelve al formulario de acceso', async ({ page }) => {
    await page.goto('/acceso/sesion-finalizada?returnUrl=%2Fmi-perfil');
    await ensureEnvironment(page);
    await expect(page.getByTestId('reason')).toBeAttached();
    await expect(page.getByTestId('datetime')).toBeVisible();
    await page.getByTestId('back-button').click();
    await expect(page).toHaveURL(/\/acceso\?returnUrl=%2Fmi-perfil/);
  });
});
