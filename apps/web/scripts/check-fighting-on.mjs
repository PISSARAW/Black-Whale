import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.ON_OUTPUT ?? path.join(root, 'output/clash-on')
await mkdir(path.join(output, 'frames'), { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-on/index.html'] },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-on/`)
  await page.waitForFunction(() => window.onFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.onFixture[method](...args), { method, args })
  await page.screenshot({ path: path.join(output, 'before.png') })
  await fixture('awaken')
  await page.clock.runFor(17)
  assert.equal((await fixture('snapshot')).player.nen.on, true)
  assert.equal((await fixture('diagnostics')).entryFrame, 0)
  for (let frame = 0; frame < 90; frame++) {
    await fixture('advance', 2)
    await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
    await page.screenshot({
      path: path.join(output, 'frames', `${String(frame).padStart(3, '0')}.png`),
    })
    if (frame === 23) await page.screenshot({ path: path.join(output, 'awakening.png') })
  }
  let audit = await fixture('diagnostics')
  assert.equal(audit.visible, true)
  assert.equal(audit.entryFrame, null)
  assert.equal(audit.opponentVisible, false)
  assert.equal(audit.irises.filter((colour) => colour === 0xffd84a).length, 2)
  assert.equal(audit.sclera.filter((colour) => colour === 0x141024).length, 2)
  await page.screenshot({ path: path.join(output, 'sustained.png') })
  const paused = await fixture('snapshot')
  await page.clock.runFor(800)
  assert.deepEqual(await fixture('snapshot'), paused)
  await fixture('advance', 1, true)
  assert.equal((await fixture('snapshot')).player.attack?.kind, 'light')
  await fixture('awaken', 'opponent')
  await page.clock.runFor(34)
  audit = await fixture('diagnostics')
  assert.equal(audit.opponentVisible, true)
  assert.equal(audit.irises.filter((colour) => colour === 0xffd84a).length, 4)
  await fixture('advance', 700)
  await page.clock.runFor(34)
  assert.equal((await fixture('snapshot')).player.nen.on, false)
  assert.equal((await fixture('diagnostics')).visible, false)
  assert.equal((await fixture('diagnostics')).irises.includes(0xffd84a), false)
  await page.screenshot({ path: path.join(output, 'after.png') })
  await fixture('reset', 'phinks')
  for (let attempt = 0; attempt < 100; attempt++) {
    await page.clock.runFor(50)
    if (await page.locator('.fight-scene.ready').count()) break
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  await page.locator('.fight-scene.ready').waitFor()
  await fixture('awaken')
  await page.clock.runFor(17)
  await fixture('advance', 48)
  await page.clock.runFor(350)
  await page.screenshot({ path: path.join(output, 'phinks.png') })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.clock.runFor(350)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(100)
  audit = await fixture('diagnostics')
  assert.equal(audit.entryFrame, null)
  assert.equal(audit.irises.includes(0xffd84a), true)
  assert.deepEqual(errors, [])
  const video = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-framerate',
      '30',
      '-i',
      path.join(output, 'frames/%03d.png'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      path.join(output, 'on-awakening.mp4'),
    ],
    { encoding: 'utf8' },
  )
  assert.equal(video.status, 0, video.stderr)
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        video: 'on-awakening.mp4',
        errors,
        checked: [
          'accepted activation',
          '180 fixed simulation frames',
          'persistent eyes',
          'pause',
          'ordinary attack',
          'both players',
          'On exhaustion',
          'reset',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`On presentation verified: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
