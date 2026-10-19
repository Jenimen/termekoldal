import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-report' }]],
  use: { baseURL: 'http://localhost:8080', trace: 'retain-on-failure' },
  projects: [
    { name: 'asztali', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'python3 -m http.server 8080', url: 'http://localhost:8080', reuseExistingServer: true },
});
