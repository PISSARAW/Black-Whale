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
  // One dev server serves every worker, and these pages are heavy — the tour
  // compiles a 3D scene, the hunt boots a game loop. Left to its default of one
  // worker per core, the suite spent its budget queueing behind itself and
  // failed on timeouts that said nothing about the site.
  workers: process.env.CI ? 2 : 4,
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
      command: `pnpm --filter @black-whale/web build && pnpm --filter @black-whale/web exec node build/index.js`,
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
