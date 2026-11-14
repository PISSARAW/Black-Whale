import { defineConfig, devices } from 'playwright/test'

// Not 3000/3002: those are the ports the dev scripts use. The process-derived
// pair also lets two Playwright commands run concurrently without sharing a
// server or racing while rewriting the same adapter output.
// Playwright reloads this config in its worker processes, so persist the first
// PID in the inherited environment rather than recalculating it in each worker.
const RUN_ID = process.env.BLACK_WHALE_E2E_RUN_ID ?? String(process.pid)
process.env.BLACK_WHALE_E2E_RUN_ID = RUN_ID
const PORT_OFFSET = Number(RUN_ID) % 1_000
const WEB_PORT = 4_200 + PORT_OFFSET * 2
const ADMIN_PORT = WEB_PORT + 1
process.env.BLACK_WHALE_E2E_ADMIN_URL = `http://127.0.0.1:${ADMIN_PORT}`
const WEB_OUTPUT = `build-e2e-${RUN_ID}`
const SVELTE_OUTPUT = `.svelte-kit-e2e-${RUN_ID}`

// The back-office refuses to start in production without a real one; in a test
// run the value only has to be known to both sides.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin'

export default defineConfig({
  testDir: './tests',
  // 30s was under the cost of the thing being tested. The suite runs against
  // the dev server, which transforms modules on demand, and a cold load of the
  // heavy pages measures 13–19s on its own — so a test that then had to click
  // something and wait for the answer was racing a budget already spent. The
  // failures that came out of it named the assertion that ran out of time
  // rather than anything about the site.
  timeout: 60_000,
  // A failed e2e is nearly always a real break, but a browser can be flaky on a
  // cold CI runner; one retry there and none locally.
  retries: process.env.CI ? 1 : 0,
  // CI renders WebGL in software. Keep one scene active at a time so browser
  // input and assertions do not contend with another renderer for the CPU.
  workers: process.env.CI ? 1 : 4,
  expect: { timeout: 10_000 },
  use: { baseURL: `http://127.0.0.1:${WEB_PORT}`, trace: 'retain-on-failure' },
  // Built, not `vite dev`.
  //
  // The dev server transforms modules on demand, which put every page on
  // screen several seconds before Svelte bound it. In that window a click
  // lands on the element, is recorded by the DOM, and reaches no handler — so
  // the gesture vanished and the assertion that followed failed on an
  // interface that was merely not listening yet. It moved from test to test
  // between runs, which is what a suite racing its own server looks like, and
  // it went unseen for as long as nothing in CI ran Playwright at all.
  //
  // Both apps are `adapter-node`, so this is the same artefact the deploy
  // serves. Measured on `/hunt`: painted in 1.1s and answering the first click
  // at 5.4s, against a dev server that swallowed that click outright.
  webServer: [
    {
      command: `BLACK_WHALE_WEB_OUTPUT=${JSON.stringify(WEB_OUTPUT)} BLACK_WHALE_SVELTE_OUTPUT=${JSON.stringify(SVELTE_OUTPUT)} pnpm --filter @black-whale/web build && pnpm --filter @black-whale/web exec node ${JSON.stringify(`${WEB_OUTPUT}/index.js`)}`,
      url: `http://127.0.0.1:${WEB_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { PORT: String(WEB_PORT), HOST: '127.0.0.1', ORIGIN: `http://127.0.0.1:${WEB_PORT}` },
    },
    {
      command: `pnpm --filter @black-whale/admin build && pnpm --filter @black-whale/admin exec node build/index.js`,
      url: `http://127.0.0.1:${ADMIN_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        ADMIN_PASSWORD,
        PORT: String(ADMIN_PORT),
        HOST: '127.0.0.1',
        ORIGIN: `http://127.0.0.1:${ADMIN_PORT}`,
      },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
})
