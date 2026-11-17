import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.FEITAN_OUTPUT ?? path.join(root, 'output/clash-feitan')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-feitan/index.html'] },
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
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`)
  })
  await page.clock.install()
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-feitan/`)
  await page.waitForFunction(() => window.feitanFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.feitanFixture[method](...args), { method, args })
  await page.screenshot({ path: path.join(output, 'before.png') })
  for (const kind of ['armour', 'sun']) {
    const folder = path.join(output, kind)
    await mkdir(folder, { recursive: true })
    await fixture('cast', kind)
    for (let frame = 0; frame < 60; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if (frame === 23 || frame === 41)
        await page.screenshot({ path: path.join(output, `${kind}-${frame}.png`) })
    }
    const audit = await fixture('diagnostics')
    assert.equal(audit.armourVisible, true)
    assert.deepEqual(audit.reveal, { coat: 1, chest: 1, arms: 1, hood: 1 })
    assert.equal(audit.sunVisible, kind === 'sun')
    if (kind === 'sun') {
      const state = await fixture('snapshot')
      assert.equal(state.phase, 'fighting')
      assert.ok(state.player.hatsuEffects.painPacker.sun.age > 0)
      const stationary = audit.sunPosition
      const frozen = await fixture('snapshot')
      await page.clock.runFor(500)
      assert.deepEqual(await fixture('snapshot'), frozen)
      assert.deepEqual((await fixture('diagnostics')).sunPosition, stationary)
    }
    const video = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'error',
        '-framerate',
        '30',
        '-i',
        path.join(folder, '%03d.png'),
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        path.join(output, `${kind === 'armour' ? 'pain-packer' : 'rising-sun'}.mp4`),
      ],
      { encoding: 'utf8' },
    )
    assert.equal(video.status, 0, video.stderr)
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.clock.runFor(300)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(100)
  assert.equal((await fixture('diagnostics')).entryFrame, null)
  await fixture('advance', 200)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).sunVisible, false)
  assert.equal((await fixture('diagnostics')).armourVisible, false)
  await fixture('reset', 'opponent')
  for (let attempt = 0; attempt < 100; attempt++) {
    await page.clock.runFor(50)
    if (await page.locator('.fight-scene.ready').count()) break
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await fixture('cast', 'armour')
  await fixture('advance', 18)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).entryFrame, 0)
  assert.equal((await fixture('diagnostics')).armourVisible, true)
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        errors,
        checked: [
          'two accepted manifestations',
          'ordered garment reveal',
          'solar formation and heat',
          'pause',
          'expiry',
          'both players',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Feitan presentation verified: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
