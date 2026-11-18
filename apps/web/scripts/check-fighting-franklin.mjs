import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.FRANKLIN_OUTPUT ?? path.join(root, 'output/clash-franklin')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-franklin/index.html'] },
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
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-franklin/`,
  )
  await page.waitForFunction(() => window.franklinFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.franklinFixture[method](...args), { method, args })
  async function reset(mode, side = 'player') {
    await fixture('reset', mode, side)
    for (let attempt = 0; attempt < 100; attempt++) {
      await page.clock.runFor(50)
      if (await page.locator('.fight-scene.ready').count()) return
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('Franklin scene did not remount')
  }
  const modes = ['short', 'burst', 'low', 'prolonged']
  const selectedModes = process.env.FRANKLIN_CAPTURE_MODES?.split(',') ?? modes
  assert.ok(selectedModes.length > 0 && selectedModes.every((mode) => modes.includes(mode)))
  let observations = {}
  try {
    observations =
      JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8')).observations ?? {}
  } catch {
    /* First full capture has no earlier observations. */
  }
  for (const mode of selectedModes) {
    await reset(mode)
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    await fixture('act')
    const seen = new Set(),
      hands = new Set()
    let sawStart = false
    const frames = mode === 'prolonged' ? 80 : 55
    for (let frame = 0; frame < frames; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      const audit = await fixture('diagnostics')
      assert.equal(
        await page.locator('[data-camera-event]').count(),
        0,
        `${mode}: type 1 must not open an inset`,
      )
      if (audit.events?.start !== null && audit.events?.start !== undefined) sawStart = true
      for (const shot of audit.events?.shots ?? []) seen.add(shot.index)
      for (const finger of audit.flashes ?? []) hands.add(finger)
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([5, 10, 20, 35].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot'),
      total = { short: 10, burst: 20, low: 10, prolonged: 40 }[mode]
    assert.equal(sawStart, true, `${mode}: missing first-emission accent`)
    assert.equal(seen.size, total)
    assert.equal(hands.size, 10, `${mode}: must cycle all ten native fingertips`)
    assert.equal(state.nextProjectileId, total + 1)
    const frozen = await fixture('snapshot')
    await page.clock.runFor(500)
    assert.deepEqual(await fixture('snapshot'), frozen)
    observations[mode] = [...seen]
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
        path.join(output, `${mode}.mp4`),
      ],
      { encoding: 'utf8' },
    )
    assert.equal(video.status, 0, video.stderr)
    process.stdout.write(`${mode}: captured and verified\n`)
  }
  await reset('prolonged', 'opponent')
  await fixture('conceal', true)
  await fixture('act')
  await fixture('advance', 40)
  await page.clock.runFor(50)
  assert.ok((await fixture('snapshot')).opponent.attack.projectilesSpawned > 0)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).visible, false)
  assert.deepEqual((await fixture('diagnostics')).flashes, [])
  await fixture('conceal', true, true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).visible, true)
  await reset('burst', 'opponent')
  await fixture('act')
  await fixture('advance', 20)
  await page.clock.runFor(50)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.clock.runFor(100)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  const beforeStop = (await fixture('snapshot')).nextProjectileId
  await fixture('interrupt')
  await fixture('advance', 20)
  await page.clock.runFor(50)
  assert.equal((await fixture('snapshot')).nextProjectileId, beforeStop)
  assert.equal((await fixture('diagnostics')).events.shots.length, 0)
  assert.deepEqual((await fixture('diagnostics')).flashes, [])
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reset('burst', 'opponent')
  await fixture('act')
  await fixture('advance', 30)
  await page.clock.runFor(100)
  assert.equal((await fixture('diagnostics')).visible, false)
  assert.deepEqual((await fixture('diagnostics')).flashes, [])
  assert.ok((await fixture('snapshot')).nextProjectileId > 1)
  assert.deepEqual(errors, [])
  if (modes.every((mode) => Array.isArray(observations[mode]))) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      modes.map((mode) => `file '${mode}.mp4'`).join('\n'),
    )
    const combined = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'error',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        path.join(output, 'sequence.txt'),
        '-c',
        'copy',
        '-movflags',
        '+faststart',
        path.join(output, 'franklin.mp4'),
      ],
      { encoding: 'utf8' },
    )
    assert.equal(combined.status, 0, combined.stderr)
  }
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        errors,
        observations,
        checked: [
          'four actual salvo variants',
          '18-frame departure accent',
          'all ten fingers',
          'emitted shot counter',
          'no secondary camera',
          'In/Gyo',
          'pause',
          'interruption',
          'opponent seat',
          '390/320px',
          'reduced motion including native flashes',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Franklin presentation verified: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
