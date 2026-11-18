import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.BLINKY_OUTPUT ?? path.join(root, 'output/clash-blinky')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-blinky/index.html'] },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-blinky/`)
  await page.waitForFunction(() => window.blinkyFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.blinkyFixture[method](...args), {
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
    throw new Error('Blinky scene did not remount')
  }

  const modes = ['objects', 'arena', 'blood', 'covered', 'empty']
  const selectedModes = process.env.BLINKY_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
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
    const before = await fixture('snapshot'),
      hp = before.opponent.health
    await fixture('act')
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    const seen = new Set(),
      ids = new Set()
    for (let frame = 0; frame < 65; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      assert.equal(await page.locator('[data-camera-event]').count(), 0, `${mode}: no inset`)
      const audit = await fixture('diagnostics')
      for (const event of audit.events?.captures ?? []) {
        seen.add(event.kind)
        ids.add(event.id)
      }
      if (mode === 'covered' || mode === 'empty') assert.equal(audit.captures, 0)
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([8, 12, 18, 28].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot')
    if (mode === 'objects') {
      assert.ok(seen.has('object'))
      assert.equal(state.player.blinky.lastObject.shape, 'card')
      assert.equal(ids.size, 1)
    }
    if (mode === 'arena') {
      assert.ok(seen.has('arena'))
      assert.equal(state.player.blinky.lastArenaObject, 'arena:crate:34')
    }
    if (mode === 'blood') {
      assert.ok(seen.has('blood'))
      assert.equal(ids.size, 6)
      assert.equal(state.opponent.health, hp - 18)
    }
    if (mode === 'empty' || mode === 'covered') assert.equal(state.opponent.health, hp)
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
  await reset('blood', 'opponent')
  await fixture('act')
  for (let i = 0; i < 50; i++) {
    await fixture('advance', 1)
    await page.clock.runFor(17)
    if ((await fixture('diagnostics')).captures > 0) break
  }
  assert.ok((await fixture('diagnostics')).captures > 0)
  await fixture('conceal', true)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.ok(
    (await fixture('diagnostics')).captures > 0,
    'extracted blood remains physical under In',
  )
  const frozen = await fixture('diagnostics')
  await page.clock.runFor(500)
  assert.deepEqual((await fixture('diagnostics')).poses, frozen.poses)
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
  assert.equal((await fixture('diagnostics')).captures, 0)
  assert.equal((await fixture('diagnostics')).wind, false)
  assert.deepEqual(errors, [])
  if (modes.every((mode) => Array.isArray(observations[mode]))) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      ['objects', 'arena', 'blood'].map((mode) => `file '${mode}.mp4'`).join('\n'),
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
        path.join(output, 'blinky.mp4'),
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
          'actual objects and blood',
          'no inset',
          'covered wounds',
          'empty suction',
          'actual mouth',
          'P2',
          'physical matter under In',
          'pause',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Blinky presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
