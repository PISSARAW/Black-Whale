import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PASSAGE_OUTPUT ?? path.join(root, 'output/clash-passages')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-passages/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-passages/`,
  )
  await page.waitForFunction(() => window.passageFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.passageFixture[method](...args), {
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
    throw new Error('Passage scene did not remount')
  }

  const modes = ['anchor', 'depart', 'return', 'invalid', 'link', 'transit', 'close', 'denied']
  const selectedModes = process.env.PASSAGE_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
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
    const before = await fixture('snapshot')
    await fixture('act')
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    const seen = new Set()
    for (let frame = 0; frame < 45; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      assert.equal(await page.locator('[data-camera-event]').count(), 0, `${mode}: no inset`)
      for (const event of (await fixture('diagnostics')).events ?? []) seen.add(event.kind)
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([2, 5, 10, 20].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot')
    const expected = {
      anchor: 'anchor',
      depart: 'transit',
      return: 'transit',
      invalid: 'close',
      link: 'link',
      transit: 'transit',
      close: 'close',
    }[mode]
    if (expected) assert.ok(seen.has(expected), `${mode}: missing ${expected}`)
    if (mode === 'denied') {
      assert.equal(seen.size, 0)
      assert.equal(state.player.x, before.player.x)
    }
    if (mode === 'anchor') {
      assert.equal(state.player.x, before.player.x)
      assert.equal(state.battlefield.luiniAnchors.player, 'player:room')
    }
    if (mode === 'depart') assert.equal(state.player.x, 85)
    if (mode === 'return') assert.equal(state.player.x, 20)
    if (mode === 'invalid') {
      assert.equal(state.battlefield.luiniAnchors.player, undefined)
      assert.equal(state.battlefield.entities.find((e) => e.id === 'player:room').invalidated, true)
    }
    if (mode === 'link') assert.equal(state.voconteDoors.networks.player.active, true)
    if (mode === 'close') assert.equal(state.voconteDoors.networks.player.active, false)
    if (mode === 'transit') {
      assert.equal(state.player.x, 72)
      assert.equal(state.voconteDoors.lastTransit.player.to, 'B')
    }
    assert.equal(state.player.health, before.player.health)
    assert.equal(state.opponent.health, before.opponent.health)
    const frozen = await fixture('snapshot')
    await page.clock.runFor(500)
    assert.deepEqual(await fixture('snapshot'), frozen)
    observations[mode] = [...seen]
    await writeFile(
      path.join(output, 'report.json'),
      JSON.stringify({ observations, checks: 'pending' }, null, 2),
    )
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
  await reset('transit', 'opponent')
  await fixture('act')
  await fixture('advance', 4)
  await page.clock.runFor(70)
  assert.equal((await fixture('snapshot')).opponent.x, 32)
  assert.equal((await fixture('snapshot')).voconteDoors.lastTransit.opponent.owner, 'opponent')
  assert.ok((await fixture('diagnostics')).events.some((e) => e.kind === 'transit'))
  const frozen = await fixture('diagnostics')
  await page.clock.runFor(500)
  assert.deepEqual((await fixture('diagnostics')).poses, frozen.poses)
  await reset('link', 'opponent')
  await fixture('act')
  await fixture('advance', 18)
  await page.clock.runFor(50)
  await fixture('conceal', true)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  let audit = await fixture('diagnostics')
  assert.equal(audit.visible, 0)
  assert.equal(audit.physical, true)
  assert.equal(audit.threshold, false)
  await fixture('conceal', true, true)
  await page.clock.runFor(50)
  audit = await fixture('diagnostics')
  assert.ok(audit.visible > 0)
  assert.equal(audit.threshold, true)
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
  audit = await fixture('diagnostics')
  assert.equal(audit.visible, 0)
  assert.equal(audit.physical, true)
  assert.equal(audit.threshold, true)
  assert.deepEqual(errors, [])
  if (modes.every((mode) => Array.isArray(observations[mode]))) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      modes
        .filter((mode) => mode !== 'denied')
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
        path.join(output, 'passages.mp4'),
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
          'actual anchors and links',
          'actual transits',
          'confirmed closure',
          'invalid room stays invalid',
          'no damage or evasion',
          'no inset',
          'P2',
          'In/Gyo',
          'physical frames',
          'pause',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Passage presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
