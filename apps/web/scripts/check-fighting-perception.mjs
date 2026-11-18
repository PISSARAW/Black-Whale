import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PERCEPTION_OUTPUT ?? path.join(root, 'output/clash-perception')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-perception/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-perception/`,
  )
  await page.waitForFunction(() => window.perceptionFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.perceptionFixture[method](...args), {
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
    throw new Error('Perception scene did not remount')
  }

  const modes = [
    'contact',
    'listen',
    'scout',
    'console',
    'alert',
    'read',
    'reply',
    'missing',
    'unanswered',
  ]
  const selectedModes = process.env.PERCEPTION_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
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
      contact: 'watch',
      listen: 'relay',
      scout: 'watch',
      console: 'console',
      alert: 'alert',
      read: 'read',
      reply: 'reply',
    }[mode]
    if (expected) assert.ok(seen.has(expected), `${mode}: missing ${expected}`)
    else assert.equal(seen.size, 0)
    if (mode === 'reply') assert.equal(state.player.bodyAndSoulReplies.length, 1)
    if (mode === 'unanswered') assert.equal(state.player.bodyAndSoulReplies?.length ?? 0, 0)
    if (mode === 'scout')
      assert.ok(state.battlefield.entities.some((e) => e.controller?.source === 'sayird'))
    if (mode === 'contact' || mode === 'listen') assert.ok(state.player.secretWindow)
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
  for (const mode of ['contact', 'scout', 'alert']) {
    await reset(mode, 'opponent')
    await fixture('act')
    for (let i = 0; i < 50; i++) {
      await fixture('advance', 1)
      await page.clock.runFor(17)
      if ((await fixture('diagnostics')).visible > 0) break
    }
    assert.ok((await fixture('diagnostics')).visible > 0, `${mode}: owner P2`)
    const pose = await fixture('diagnostics')
    await page.clock.runFor(500)
    assert.deepEqual((await fixture('diagnostics')).poses, pose.poses)
    await fixture('view', 'player')
    await page.clock.runFor(50)
    const hidden = await fixture('diagnostics')
    assert.equal(hidden.visible, 0)
    assert.deepEqual(hidden.events, [])
    if (mode === 'contact') assert.equal(hidden.owl, false)
    if (mode === 'alert') assert.equal(hidden.console, false)
  }
  await reset('contact', 'opponent')
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
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(100)
  const reduced = await fixture('diagnostics')
  assert.equal(reduced.visible, 0)
  assert.equal(reduced.owl, true)
  assert.deepEqual(errors, [])
  if (modes.every((mode) => Array.isArray(observations[mode]))) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      modes
        .slice(0, 7)
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
        path.join(output, 'perception.mp4'),
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
          'actual acquired information',
          'no answer text in effects',
          'no invented animal or reply',
          'no inset',
          'P2 owner',
          'hidden from other viewer',
          'private owl and console',
          'pause',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Perception presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
