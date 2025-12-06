import { defineConfig, devices } from '@playwright/test';

// Use Railway URL in CI, localhost for local development
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:5173';

// Only start local webServer if not testing against remote URL
const useLocalServer = !process.env.TEST_BASE_URL;

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? [['html'], ['list']] : 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Increase timeout for CI/remote environments
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

  // Only configure webServer for local development
  ...(useLocalServer ? {
    webServer: {
      command: 'npm run dev:client -- --host 0.0.0.0 --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 180000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  } : {}),
});
