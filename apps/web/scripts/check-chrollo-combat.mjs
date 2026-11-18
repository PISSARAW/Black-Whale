import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/chrollo-combat')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/chrollo-combat/index.html'] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.clock.install()
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/chrollo-combat/`)
  await page.waitForFunction(() => window.chrolloCombat)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  const call = (method, ...args) =>
    page.evaluate(({ method, args }) => window.chrolloCombat[method](...args), { method, args })
  async function reset(mode, left = false) {
    await call('reset', mode, left)
    for (let attempt = 0; attempt < 100; attempt++) {
      await page.clock.runFor(50)
      if (await page.locator('.fight-scene.ready').count()) return
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('Chrollo scene did not remount')
  }
  const observations = []
  for (const left of [false, true]) {
    for (const mode of ['palm', 'knife', 'kick', 'closed']) {
      await reset(mode, left)
      for (let frame = 0; frame < 32; frame += 4) {
        await call('advance', 4)
        await page.clock.runFor(67)
        const state = await call('snapshot')
        observations.push({
          mode,
          left,
          frame: state.frame,
          pose: state.opponent.pose,
          move: state.opponent.attack?.moveId,
          dash: state.opponent.motion?.dash,
          shots: state.projectiles.length,
          x: state.opponent.x,
          gap: Math.abs(state.player.x - state.opponent.x),
          pressure: state.opponent.pressureRead,
          footwork: state.opponent.chrolloFootwork,
          hurt: state.opponent.hitStun,
        })
        await page.screenshot({
          path: path.join(output, `${mode}-${left ? 'right' : 'left'}-${frame + 4}.png`),
        })
      }
      const frozen = await call('snapshot')
      await page.clock.runFor(300)
      assert.deepEqual(await call('snapshot'), frozen)
    }
  }
  await reset('duel')
  const moves = new Set()
  let knife = false,
    dash = false
  for (let frame = 0; frame < 1200; frame += 4) {
    await call('advance', 4)
    const state = await call('snapshot')
    if (state.opponent.attack) moves.add(state.opponent.attack.moveId ?? state.opponent.attack.kind)
    knife ||= state.opponent.historicalWeapon === 'ben-knife'
    dash ||= Boolean(state.opponent.motion?.dash)
    if (frame % 120 === 0) {
      await page.clock.runFor(67)
      await page.screenshot({ path: path.join(output, `duel-${frame}.png`) })
    }
  }
  await writeFile(
    path.join(output, 'observations.json'),
    JSON.stringify({ knife, dash, moves: [...moves], observations }, null, 2),
  )
  assert.ok(knife, 'actual paid knife preparation')
  assert.ok(dash, 'actual AI dash')
  assert.ok(
    [...moves].some((id) => /Light|Heavy/.test(id)),
    'physical attacks',
  )
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await reset('knife')
    await call('advance', 8)
    await page.clock.runFor(300)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, errors, knife, dash, moves: [...moves], observations }, null, 2),
  )
  process.stdout.write(`Chrollo combat verified: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
