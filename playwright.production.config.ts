import { defineConfig } from 'playwright/test'

const baseURL = process.env.BLACK_WHALE_PRODUCTION_URL
if (!baseURL) throw new Error('Set BLACK_WHALE_PRODUCTION_URL explicitly to run live tests')

export default defineConfig({
  testDir: './tests',
  testMatch: '*.production.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 30_000 },
  outputDir: 'test-results/production',
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
