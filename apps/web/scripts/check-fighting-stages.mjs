import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.FIGHT_STAGES_CHECK_OUTPUT ?? '/tmp/black-whale-fighting-stages'
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
const checks = []
const errors = []
const only = process.env.FIGHT_STAGES_ONLY?.split(',')
const views = process.env.FIGHT_STAGES_VIEWS?.split(',') ?? ['normal', 'edges', 'biscuit']
const widths = process.env.FIGHT_STAGES_WIDTHS?.split(',').map(Number) ?? [1100, 390, 320]
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--enable-unsafe-swiftshader', '--no-proxy-server'],
  })
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(`${error.message}\n`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
      process.stderr.write(`${message.text()}\n`)
    }
  })
  // Observe actual WebGL presents, including the post-processing render target.
  await page.addInitScript(() => {
    window.stagePresents = 0
    for (const method of ['drawArrays', 'drawElements']) {
      const original = WebGL2RenderingContext.prototype[method]
      WebGL2RenderingContext.prototype[method] = function (...args) {
        if (this.getParameter(this.FRAMEBUFFER_BINDING) === null) window.stagePresents++
        return original.apply(this, args)
      }
    }
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-stages/`,
    { waitUntil: 'domcontentloaded', timeout: 120000 },
  )
  await page.waitForFunction(() => window.stagesFixture, undefined, { timeout: 120000 })
  const stages = await page.evaluate(() => window.stagesFixture.stages())
  assert.equal(stages.length, 33)
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 })
    for (const stage of stages) {
      if (only && !only.includes(stage.id)) continue
      await page.evaluate((id) => {
        window.stagePresents = 0
        return window.stagesFixture.showStage(id)
      }, stage.id)
      process.stdout.write(`Rendering ${stage.id} · ${width}px\n`)
      await page.waitForFunction(
        () => window.stagePresents >= 4 || document.querySelector('.fight-scene.failed'),
        undefined,
        { timeout: 90000 },
      )
      if (await page.locator('.fight-scene.failed').count())
        await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
      await page.waitForTimeout(650)
      assert.equal(await page.locator('.fight-scene.failed').count(), 0, stage.id)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `${stage.id} at ${width}px`,
      )
      const scene = page.locator('.fight-arena')
      const clip = await scene.boundingBox()
      assert.ok(clip)
      await page.screenshot({
        clip,
        timeout: 90000,
        path: path.join(output, `${stage.id}-${width}.png`),
      })
      // Match extremes and the largest body use the same scenery without hiding fighters.
      for (const view of views.filter((view) => view !== 'normal')) {
        const before = await page.evaluate(() => window.stagePresents)
        await page.evaluate(({ id, view }) => window.stagesFixture.showStage(id, view), {
          id: stage.id,
          view,
        })
        await page.waitForFunction((before) => window.stagePresents >= before + 4, before, {
          timeout: 90000,
        })
        await page.waitForTimeout(650)
        assert.equal(await page.locator('.fight-scene.failed').count(), 0, `${stage.id}/${view}`)
        const viewClip = await scene.boundingBox()
        assert.ok(viewClip)
        await page.screenshot({
          clip: viewClip,
          timeout: 90000,
          path: path.join(output, `${stage.id}-${width}-${view}.png`),
        })
      }
      checks.push({ stage: stage.id, width, views })
      await writeFile(
        path.join(output, 'progress.json'),
        JSON.stringify({ checks, errors }, null, 2),
      )
      process.stdout.write(`${checks.length}: ${stage.id} · ${width}px\n`)
    }
  }
  await page.evaluate(() => window.stagesFixture.setLanguage('en'))
  for (const stage of stages)
    assert.equal(
      (await page.getByRole('button', { name: stage.nameEn, exact: false }).count()) > 0,
      true,
      stage.id,
    )
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, checks, errors }, null, 2),
  )
  process.stdout.write(
    `Stages passed: ${checks.length} stage/viewport checks, ${views.length} framing(s) each · ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
