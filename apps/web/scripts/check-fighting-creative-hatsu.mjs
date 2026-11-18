import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CREATIVE_HATSU_OUTPUT ?? path.join(root, 'output/clash-creative-hatsu')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-creative-hatsu/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-creative-hatsu/`,
  )
  await page.waitForFunction(() => window.performanceFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.performanceFixture[method](...args), {
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
    throw new Error('Creative Hatsu scene did not remount')
  }

  const modes = [
    'music',
    'writing',
    'observation',
    'ready',
    'empty',
    'missing',
    'interrupted',
    'stopped',
  ]
  const selectedModes =
    process.env.CREATIVE_HATSU_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
  assert.ok(selectedModes.every((mode) => modes.includes(mode)))
  let observations = {}
  try {
    observations =
      JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8')).observations ?? {}
  } catch {
    /* New capture. */
  }
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
    const state = await fixture('snapshot'),
      diagnostic = await fixture('diagnostics')
    const expected = {
      music: 'playing',
      writing: 'written',
      observation: 'study',
      ready: 'ready',
      empty: 'watch',
    }[mode]
    if (expected) assert.ok(seen.has(expected), `${mode}: missing ${expected}`)
    else assert.equal(seen.size, 0)
    assert.equal(state.player.health, initial.player.health)
    assert.equal(state.opponent.health, initial.opponent.health)
    assert.equal(state.projectiles.length, 0)
    if (mode === 'music') {
      assert.equal(diagnostic.music, true)
      assert.equal(state.opponent.hatsuEffects.entrancedFrames, 1)
    }
    if (mode === 'writing') {
      assert.equal(diagnostic.progress, 1)
      assert.equal(diagnostic.pen, false)
      assert.equal(state.player.bashoPoem.ready, true)
    }
    if (mode === 'empty') {
      assert.equal(diagnostic.observedFrames, 0)
      assert.equal(state.player.predator.analysis, null)
    }
    if (mode === 'ready') {
      assert.equal(diagnostic.observedFrames, 180)
      assert.equal(state.player.predator.hunt, null)
    }
    if (mode === 'missing' || mode === 'stopped') assert.equal(diagnostic.music, false)
    if (mode === 'interrupted') assert.equal(diagnostic.paper, false)
    const frozen = await fixture('snapshot'),
      pose = diagnostic.poses
    await page.clock.runFor(500)
    assert.deepEqual(await fixture('snapshot'), frozen)
    assert.deepEqual((await fixture('diagnostics')).poses, pose, `${mode}: pause`)
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
  for (const mode of ['music', 'writing', 'observation']) {
    await reset(mode, 'opponent')
    await fixture('act')
    await fixture('advance', 3)
    await page.clock.runFor(50)
    assert.ok(
      (await fixture('diagnostics')).events.some((e) => e.owner === 'opponent'),
      `${mode}: P2`,
    )
  }
  await reset('observation', 'opponent')
  await fixture('act')
  await fixture('advance', 20)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).focus, true)
  assert.ok((await fixture('diagnostics')).observedFrames > 0)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).focus, false)
  assert.equal((await fixture('diagnostics')).observedFrames, 0)
  assert.deepEqual((await fixture('diagnostics')).events, [])
  await reset('music')
  await fixture('act')
  await fixture('advance', 25)
  await fixture('stop')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).music, false)
  await reset('writing')
  await fixture('act')
  await fixture('advance', 15)
  await fixture('stop')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).paper, false)
  await reset('writing')
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
  assert.equal((await fixture('diagnostics')).ornament, false)
  assert.equal((await fixture('diagnostics')).paper, true)
  const pen = (await fixture('diagnostics')).poses.at(-1)
  await fixture('advance', 5)
  await page.clock.runFor(100)
  assert.deepEqual((await fixture('diagnostics')).poses.at(-1), pen)
  assert.deepEqual(errors, [])
  const sequence = ['music', 'writing', 'observation', 'ready']
  if (sequence.every((mode) => Array.isArray(observations[mode]))) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      sequence.map((mode) => `file '${mode}.mp4'`).join('\n'),
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
        path.join(output, 'performance.mp4'),
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
          'real preparation and acquisition',
          'no damage or invented knowledge',
          'no inset',
          'P2',
          'private observation',
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
  process.stdout.write(`Performance presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
