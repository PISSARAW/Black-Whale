import { defineConfig, devices } from 'playwright/test'

// Not 3000/3002: those are the ports the dev scripts use, and an e2e run that
// silently reuses whatever a developer happens to have open there is a run that
// proves nothing. These are e2e-only.
const WEB_PORT = 4173
const ADMIN_PORT = 4174

// The back-office refuses to start in production without a real one; in a test
// run the value only has to be known to both sides.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  // A failed e2e is nearly always a real break, but a browser can be flaky on a
  // cold CI runner; one retry there and none locally.
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://127.0.0.1:${WEB_PORT}`, trace: 'retain-on-failure' },
  webServer: [
    {
      command: `pnpm --filter @black-whale/web dev --host 127.0.0.1 --port ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @black-whale/admin dev --host 127.0.0.1 --port ${ADMIN_PORT}`,
      url: `http://127.0.0.1:${ADMIN_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ADMIN_PASSWORD },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
})
