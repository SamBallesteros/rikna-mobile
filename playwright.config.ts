import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui', fullyParallel: false, workers: 1, retries: 0, timeout: 90000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8091', channel: 'chrome', headless: true, viewport: { width: 390, height: 844 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', actionTimeout: 15000 },
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:8091', env: { PORT: '8091' }, reuseExistingServer: false },
});
