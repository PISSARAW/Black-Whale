import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.BACKGROUND_CHECK_OUTPUT ?? '/tmp/black-whale-background-events'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-stages/index.html'] },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
const checks = []
try {
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--no-proxy-server'],
  })
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  // Advance the production RAF clock explicitly: compilation time must not skip a cameo.
  await page.addInitScript(() => {
    window.backgroundClock = 0
    window.backgroundPresents = 0
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) =>
      raf(() => {
        window.backgroundClock += 1000 / 60
        callback(window.backgroundClock)
      })
    for (const method of ['drawArrays', 'drawElements']) {
      const original = WebGL2RenderingContext.prototype[method]
      WebGL2RenderingContext.prototype[method] = function (...args) {
        if (this.getParameter(this.FRAMEBUFFER_BINDING) === null) window.backgroundPresents++
        return original.apply(this, args)
      }
    }
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-stages/`,
    { waitUntil: 'domcontentloaded', timeout: 120000 },
  )
  await page.waitForFunction(() => window.stagesFixture, undefined, { timeout: 120000 })
  async function present(stage, name, advance = 0) {
    const before = await page.evaluate((advance) => {
      window.backgroundClock += advance * 1000
      return window.backgroundPresents
    }, advance)
    await page.waitForFunction(
      (before) =>
        window.backgroundPresents >= before + 4 || document.querySelector('.fight-scene.failed'),
      before,
      { timeout: 90000 },
    )
    assert.equal(await page.locator('.fight-scene.failed').count(), 0, stage)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    assert.ok((await page.locator('.background-description').textContent()).length > 30)
    const clip = await page.locator('.fight-arena').boundingBox()
    assert.ok(clip)
    await page.screenshot({ clip, timeout: 90000, path: path.join(output, `${stage}-${name}.png`) })
    checks.push({ stage, name })
    process.stdout.write(`${stage} · ${name}\n`)
  }
  const scenarios = [
    ['whale-hold', 7],
    ['heilly-hideout', 10.5],
    ['screening-room', 5],
    ['marayam-salon', 6.5],
    ['royal-salon', 0],
    ['hull-suspension', 0],
  ]
  const only = process.env.BACKGROUND_ONLY?.split(',')
  for (const [stage, advance] of scenarios.filter(([stage]) => !only || only.includes(stage))) {
    await page.evaluate(async (stage) => {
      window.backgroundClock = 0
      await window.stagesFixture.showStage(stage)
    }, stage)
    await present(stage, 'initial')
    if (advance) await present(stage, 'later', advance)
    else {
      await page.evaluate(
        (stage) =>
          window.stagesFixture.backgroundSignal(stage === 'royal-salon' ? 'finish' : 'impact'),
        stage,
      )
      await present(stage, 'reaction')
    }
  }
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.stagesFixture.showStage('woble-salon'))
  await present('woble-salon', 'mobile-reduced-motion')
  const allStages = await page.evaluate(() =>
    window.stagesFixture
      .stages()
      .map(({ id }) => ({ id, recipe: window.stagesFixture.backgroundRecipe(id) })),
  )
  assert.equal(allStages.length, 33)
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, checks, allStages, errors }, null, 2),
  )
  process.stdout.write(`Stage background events passed: ${checks.length} renders · ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
