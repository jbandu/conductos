import { defineConfig, devices } from '@playwright/test';

// In CI, the workflow starts the server separately, so skip webServer
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === 'true';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? [['html'], ['list']] : 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Increase timeout for CI environments
    actionTimeout: process.env.CI ? 30000 : 15000,
    navigationTimeout: process.env.CI ? 60000 : 30000,
  },

  // Global test timeout
  timeout: process.env.CI ? 60000 : 30000,

  // Expect timeout for assertions
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Only configure webServer if not skipped (CI starts server separately)
  ...(skipWebServer ? {} : {
    webServer: {
      command: 'npm run dev:client -- --host 0.0.0.0 --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 180000, // 3 minutes for CI cold start
      stdout: 'pipe',
      stderr: 'pipe',
    },
  }),
});
