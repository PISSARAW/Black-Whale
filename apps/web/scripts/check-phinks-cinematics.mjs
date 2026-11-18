import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PHINKS_OUTPUT ?? path.join(root, 'output/clash-phinks')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-phinks-cinematics/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-phinks-cinematics/`,
  )
  await page.waitForFunction(() => window.phinksFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.phinksFixture[method](...args), {
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
    throw new Error('Phinks scene did not remount')
  }

  const modes = [
    'rotations',
    'hit',
    'one-turn',
    'block',
    'miss',
    'interrupted',
    'partial',
    'ordinary',
  ]
  const selected = process.env.PHINKS_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
  assert.ok(selected.every((mode) => modes.includes(mode)))
  let observations = {}
  try {
    observations =
      JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8')).observations ?? {}
  } catch {
    /* New capture. */
  }
  for (const mode of selected) {
    await reset(mode)
    const initial = await fixture('snapshot')
    await fixture('act')
    assert.equal(await page.locator('[data-camera-event="phinks.charged-impact"]').count(), 0)
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    const seen = new Map()
    let shotFrames = 0,
      activePause = false
    const frames = mode === 'rotations' ? 72 : 60
    for (let frame = 0; frame < frames; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      const diag = await fixture('diagnostics'),
        state = await fixture('snapshot')
      for (const event of diag.events ?? []) seen.set(event.id, event)
      const major = await page.locator('[data-camera-event="phinks.charged-impact"]').count()
      if (major) {
        shotFrames++
        assert.ok(state.cyclotronContacts?.player, `${mode}: shot starts after actual contact`)
      }
      if (!['hit', 'one-turn'].includes(mode))
        assert.equal(major, 0, `${mode}: no charged-impact inset`)
      if (mode === 'rotations') {
        assert.equal(await page.locator('[data-camera-event]').count(), 0)
        assert.ok(
          [...seen.values()].every((e) => e.turns <= state.player.hatsuEffects.cyclotronTurns),
        )
      }
      if (!activePause && diag.visible > 0) {
        const frozen = state,
          poses = diag.poses
        await page.clock.runFor(500)
        assert.deepEqual(await fixture('snapshot'), frozen)
        assert.deepEqual((await fixture('diagnostics')).poses, poses)
        activePause = true
      }
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([5, 10, 20, 45].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot')
    if (mode === 'rotations') {
      assert.equal(seen.size, 4)
      assert.equal(state.player.hatsuEffects.cyclotronTurns, 4)
    } else if (['hit', 'one-turn'].includes(mode)) {
      assert.equal(seen.size, 1)
      assert.equal([...seen.values()][0].kind, 'impact')
      assert.equal([...seen.values()][0].turns, mode === 'hit' ? 3 : 1)
      assert.ok(shotFrames >= 41 && shotFrames <= 42, '84-frame shot sampled every two frames')
      assert.equal(
        state.opponent.health,
        initial.opponent.health - state.cyclotronContacts.player.damage,
      )
      assert.equal(state.player.hatsuEffects.cyclotronTurns, 0)
    } else {
      assert.equal(seen.size, 0)
      assert.equal(state.cyclotronContacts, undefined)
      if (mode === 'block') assert.equal(state.impact.blocked, true)
      if (mode === 'interrupted') assert.ok(state.player.health < initial.player.health)
      if (mode === 'ordinary') assert.equal(state.player.hatsuEffects.cyclotronTurns, 3)
    }
    observations[mode] = { events: [...seen.values()], shotFrames }
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
    await writeFile(
      path.join(output, 'report.json'),
      JSON.stringify({ passed: false, observations }, null, 2),
    )
    process.stdout.write(`${mode}: captured and verified\n`)
  }
  for (const mode of ['rotations', 'hit', 'one-turn']) {
    await reset(mode, 'opponent')
    await fixture('act')
    await fixture('advance', mode === 'rotations' ? 36 : 16)
    await page.clock.runFor(500)
    const diag = await fixture('diagnostics')
    assert.ok(
      diag.events.some((e) => e.owner === 'opponent'),
      `${mode}: P2`,
    )
    if (mode !== 'rotations')
      assert.equal(await page.locator('[data-camera-event="phinks.charged-impact"]').count(), 1)
  }
  await reset('rotations', 'opponent')
  await fixture('act')
  await fixture('advance', 36)
  await fixture('conceal', true)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).visible, 0)
  await fixture('gyo', 'player', true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).visible, 1)
  await reset('hit')
  await fixture('act')
  await fixture('advance', 16)
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
  assert.equal(await page.locator('[data-camera-event="phinks.charged-impact"]').count(), 0)
  assert.deepEqual(errors, [])
  if (['rotations', 'hit', 'one-turn'].every((mode) => observations[mode])) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      ['rotations', 'hit', 'one-turn'].map((mode) => `file '${mode}.mp4'`).join('\n'),
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
        path.join(output, 'phinks.mp4'),
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
          'actual full rotations',
          'confirmed charged contacts',
          '84-frame type 2',
          'miss / block / interruption / partial / ordinary',
          'P2',
          'In/Gyo',
          'active pause',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Phinks presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
