import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { inspectIntroDirection } from './inspect-intro-direction.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = '/tmp/black-whale-introduction-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: {
    entries: ['ui-tests/fighting-introduction/index.html'],
    holdUntilCrawlEnd: false,
  },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-proxy-server',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = [],
  checks = []
page.on('pageerror', (error) => errors.push(error.message))
page.setDefaultTimeout(120000)
const reset = (options = {}) =>
  page.evaluate((options) => window.introductionFixture.reset(options), options)
const snapshot = () => page.evaluate(() => window.introductionFixture.snapshot())
const pause = (value) => page.evaluate((value) => window.introductionFixture.pause(value), value)
async function capture(name) {
  await writeFile(
    path.join(output, `${name}.json`),
    JSON.stringify(
      await page.evaluate(() => ({
        visibility: document.visibilityState,
        actor: document.querySelector('.actor')?.textContent,
        opacity: document.querySelector('.actor')
          ? getComputedStyle(document.querySelector('.actor')).opacity
          : null,
        scene: document.querySelector('.fight-scene')?.className,
        canvas: [document.querySelector('canvas')?.width, document.querySelector('canvas')?.height],
      })),
      null,
      2,
    ),
  )
  await page.screenshot({ path: path.join(output, `${name}.png`) })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  )
}
try {
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-introduction/`,
  )
  await page.waitForSelector('.fight-scene.ready')
  await reset()
  await page.waitForSelector('[data-intro-shot="player"] .actor')
  await page.waitForTimeout(800)
  await pause(true)
  const initial = await snapshot()
  await capture('player-desktop')
  assert.equal(initial.state.phase, 'ready')
  assert.equal(initial.state.frame, 0)
  await page.waitForTimeout(300)
  assert.deepEqual((await snapshot()).state, initial.state)
  await pause(false)
  await page.waitForSelector('[data-intro-shot="opponent"] .actor')
  await page.waitForTimeout(500)
  await pause(true)
  await capture('opponent-desktop')
  assert.equal((await snapshot()).state.phase, 'ready')
  await pause(false)
  await page.waitForSelector('output[data-phase="fighting"]')
  assert.equal((await snapshot()).starts, initial.starts + 1)
  checks.push('two-entrances-pause-frozen-simulation-automatic-start')

  await reset()
  await page.getByRole('button', { name: /Passer/ }).click()
  await page.waitForSelector('output[data-phase="fighting"]')
  await reset()
  await page.keyboard.press('Enter')
  await page.waitForSelector('output[data-phase="fighting"]')
  checks.push('rematch-button-and-keyboard-skip')

  await reset({ mode: 'brief' })
  await page.waitForSelector('[data-intro-shot="ready"]')
  assert.equal(await page.locator('.actor').count(), 0)
  await page.waitForSelector('output[data-phase="fighting"]')
  await reset({ mode: 'off' })
  await page.waitForSelector('output[data-phase="fighting"]')
  assert.equal(await page.locator('.fight-introduction').count(), 0)
  checks.push('brief-and-disabled-settings')

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 720 })
    await reset({ player: 'franklin', opponent: 'phinks', language: 'en' })
    await page.waitForSelector('.fight-scene.ready')
    await page.waitForSelector('.actor')
    await page.waitForTimeout(700)
    await page.waitForFunction(
      () => Number(getComputedStyle(document.querySelector('.actor')).opacity) > 0.95,
    )
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )
    await pause(true)
    await capture(`mobile-${width}`)
    await pause(false)
    await page.getByRole('button', { name: /Skip/ }).click()
    await page.waitForSelector('output[data-phase="fighting"]')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reset()
  await page.waitForSelector('.actor')
  await page.keyboard.press('Space')
  await page.waitForSelector('output[data-phase="fighting"]')
  checks.push('mobile-english-and-reduced-motion')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await inspectIntroDirection(page, output)
  checks.push('six-personalities-live-rig-and-free-orbits-two-poses-p2-mobile')
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ checks, errors }, null, 2))
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ error: String(error), errors }, null, 2),
  )
  await page.screenshot({ path: path.join(output, 'failure.png') })
  throw error
} finally {
  await browser.close()
  await server.close()
}
