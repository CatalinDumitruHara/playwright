import { defineConfig, devices } from '@playwright/test';

/**
 * MIND construction — Playwright config for frontend archetypes.
 * baseURL comes from the session (frontend serve). API stubs use WireMock via app env.
 * No committed visual baselines: @visual specs write screenshots to test-results/ only.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4200';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e-spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'off',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
