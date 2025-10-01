import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Guest Chat E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-results.json' }],
  ],

  // Shared test timeout
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Global test settings
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 15000,
  },

  // Configure projects for major browsers
  projects: [
    // Desktop browsers
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

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 13'],
        // Custom viewport for consistent testing
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13 Pro Max'],
        // Custom viewport for larger phones
        viewport: { width: 414, height: 896 },
      },
    },

    // Tablet
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
