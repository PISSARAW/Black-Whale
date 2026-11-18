import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.SUPPORT_OUTPUT ?? path.join(root, 'output/clash-support')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-support/index.html'] },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-support/`)
  await page.waitForFunction(() => window.supportFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.supportFixture[method](...args), {
      method,
      args,
    })
  async function reset(mode, side = 'player') {
    await fixture('reset', mode, side)
    for (let attempt = 0; attempt < 100; attempt++) {
      await page.clock.runFor(50)
      if (await page.locator('.fight-scene.ready').count()) return
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('Support scene did not remount')
  }

  const modes = [
    'growth',
    'mission',
    'delivery',
    'massage',
    'piano',
    'missing-seed',
    'missing-bird',
    'denied',
  ]
  const selectedModes = process.env.SUPPORT_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
  assert.ok(selectedModes.every((mode) => modes.includes(mode)))
  const observations = {}
  for (const mode of selectedModes) {
    await reset(mode)
    const initial = await fixture('snapshot')
    await fixture('act')
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    const seen = new Set()
    for (let frame = 0; frame < 45; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      assert.equal(await page.locator('[data-camera-event]').count(), 0, `${mode}: no inset`)
      const diagnostic = await fixture('diagnostics')
      for (const event of diagnostic.events ?? []) seen.add(event.kind)
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([2, 5, 10, 20].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot')
    const expected = {
      growth: 'growth',
      mission: 'dispatch',
      delivery: 'delivery',
      massage: 'treatment',
      piano: 'treatment',
    }[mode]
    if (expected) assert.ok(seen.has(expected), `${mode}: missing ${expected}`)
    else assert.equal(seen.size, 0)
    assert.equal(state.player.health, initial.player.health)
    assert.equal(state.opponent.health, initial.opponent.health)
    assert.equal(state.projectiles.length, 0)
    const diagnostic = await fixture('diagnostics')
    if (mode === 'growth') assert.deepEqual(diagnostic.plant, [1, 1, 1])
    if (mode === 'mission') assert.equal(diagnostic.bird, true)
    if (mode === 'delivery')
      assert.equal(state.battlefield.entities.find((e) => e.id === 'player:bird').delivered, true)
    if (mode === 'piano') {
      assert.ok(state.player.arsenalSleep)
      assert.ok(state.player.cookie.frames < 30 * 60 * 60)
    }
    if (mode === 'massage' || mode === 'piano') assert.equal(diagnostic.cookie, true)
    const frozen = await fixture('snapshot')
    const pose = {
      plant: diagnostic.plant,
      wings: diagnostic.wings,
      cookiePose: diagnostic.cookiePose,
    }
    await page.clock.runFor(500)
    assert.deepEqual(await fixture('snapshot'), frozen)
    const paused = await fixture('diagnostics')
    assert.deepEqual(
      { plant: paused.plant, wings: paused.wings, cookiePose: paused.cookiePose },
      pose,
      `${mode}: pause`,
    )
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
  for (const mode of ['growth', 'mission', 'massage']) {
    await reset(mode, 'opponent')
    await fixture('act')
    await fixture('advance', 3)
    await page.clock.runFor(50)
    assert.ok(
      (await fixture('diagnostics')).events.some((e) => e.owner === 'opponent'),
      `${mode}: P2`,
    )
  }
  await reset('mission', 'opponent')
  await fixture('act')
  await fixture('advance', 20)
  await fixture('view', 'player')
  await fixture('gyo', 'opponent', true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).tether, false)
  await fixture('gyo', 'player', true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).tether, true)
  await fixture('stop')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).tether, false)
  assert.equal((await fixture('diagnostics')).bird, true)
  await reset('massage', 'opponent')
  await fixture('act')
  await fixture('advance', 4)
  await fixture('conceal', true)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).cookie, false)
  await fixture('gyo', 'player', true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).cookie, true)
  await fixture('stop')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).cookie, false)
  await reset('massage')
  await fixture('act')
  await fixture('advance', 4)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.clock.runFor(100)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(100)
  assert.equal((await fixture('diagnostics')).visible, 0)
  assert.equal((await fixture('diagnostics')).cookie, true)
  assert.deepEqual(errors, [])
  if (
    ['growth', 'mission', 'delivery', 'massage', 'piano'].every((mode) =>
      selectedModes.includes(mode),
    )
  ) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      ['growth', 'mission', 'delivery', 'massage', 'piano']
        .map((mode) => `file '${mode}.mp4'`)
        .join('\n'),
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
        path.join(output, 'support.mp4'),
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
        observations,
        errors,
        checked: [
          'actual support facts',
          'no damage or extra entities',
          'no inset',
          'P2',
          'selected viewer Gyo',
          'interruption',
          'pause',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Support presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
