import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    ...devices['Desktop Chrome'],
    trace: 'on',
    video: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'auth',
      testMatch: 'auth.setup.ts',
      timeout: 600_000,
      use: { headless: false, trace: 'off', video: 'off', screenshot: 'off' },
    },
    {
      name: 'chromium',
      testMatch: '*.spec.ts',
    },
    {
      name: 'mobile-safari',
      testMatch: '*.spec.ts',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: '*.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'tablet',
      testMatch: '*.spec.ts',
      use: { ...devices['iPad Mini landscape'] },
    },
  ],
  webServer: {
    command: process.env.E2E_PREVIEW === '1'
      ? 'npm run preview -- --host localhost --port 5173 --strictPort'
      : 'npm run dev -- --host localhost --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
