import { test, expect } from '@playwright/test';

/**
 * @functional — placeholder interaction check for the welcome screen.
 * Agents extend this file (or add sibling *.e2e-spec.ts) per screen_codes / DoD.
 */
test.describe('@functional welcome', () => {
  // Salta el selector de entorno de ngx-multienvironment (como el smoke de la plataforma: 'dev');
  // sin esto solo se pinta el overlay fijo y <body> mide 0 px ("hidden" para Playwright).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('OKCD_APPLICATION_ENVIRONMENT', 'dev'));
  });

  test('welcome page exposes main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Soft presence: archetype welcome page should render something beyond empty body.
    const text = (await page.locator('body').innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
  });
});
