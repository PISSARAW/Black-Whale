import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.SWEET_HOME_OUTPUT ?? path.join(root, 'output/clash-sweet-home')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-sweet-home/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-sweet-home/`,
  )
  await page.waitForFunction(() => window.sweetHomeFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.sweetHomeFixture[method](...args), {
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
    throw new Error('Sweet Home scene did not remount')
  }

  const modes = [
    'return',
    'absorb',
    'backlash',
    'object',
    'external-object',
    'broken-object',
    'no-contact',
    'stance',
  ]
  const positives = modes.slice(0, 5)
  const selectedModes = process.env.SWEET_HOME_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
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
    const resolved = await fixture('snapshot')
    if (positives.includes(mode))
      assert.ok(
        resolved.impact?.transfer || resolved.impact?.objectTransfer,
        `${mode}: actual route`,
      )
    else {
      assert.equal(resolved.impact?.transfer, undefined)
      assert.equal(resolved.impact?.objectTransfer, undefined)
    }
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    const seen = []
    for (let frame = 0; frame < 45; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      if (positives.includes(mode) || mode === 'stance')
        assert.equal(await page.locator('[data-camera-event]').count(), 0, `${mode}: no inset`)
      const diagnostic = await fixture('diagnostics')
      for (const event of diagnostic.events ?? [])
        if (!seen.some((e) => e.id === event.id)) seen.push(event)
      if (mode === 'return') assert.equal(diagnostic.right, false)
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([2, 5, 10, 20].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot'),
      diagnostic = await fixture('diagnostics')
    if (positives.includes(mode)) {
      assert.equal(seen.length, 1, `${mode}: one confirmed route`)
      assert.equal(seen[0].owner, 'player')
      assert.ok(seen[0].damage > 0)
      if (mode === 'object' || mode === 'external-object') {
        assert.equal(seen[0].recipient.kind, 'object')
        assert.equal(
          state.battlefield.entities.find((e) => e.id === 'player:crate').health,
          100 - seen[0].damage,
        )
        assert.equal(state.player.health, initial.player.health)
        assert.equal(state.opponent.health, initial.opponent.health)
      } else {
        const target = mode === 'return' ? 'opponent' : 'player'
        assert.equal(state[target].health, initial[target].health - seen[0].damage)
        assert.equal(
          state[target === 'player' ? 'opponent' : 'player'].health,
          initial[target === 'player' ? 'opponent' : 'player'].health,
        )
      }
      assert.equal(seen[0].backlash, mode === 'backlash')
    } else assert.equal(seen.length, 0)
    const frozen = await fixture('snapshot'),
      poses = diagnostic.poses
    await page.clock.runFor(500)
    assert.deepEqual(await fixture('snapshot'), frozen)
    assert.deepEqual((await fixture('diagnostics')).poses, poses)
    observations[mode] = seen.map(({ owner, from, recipient, backlash, damage }) => ({
      owner,
      from,
      recipient,
      backlash,
      damage,
    }))
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
  for (const mode of positives) {
    await reset(mode, 'opponent')
    await fixture('act')
    await fixture('advance', 2)
    await page.clock.runFor(50)
    const diag = await fixture('diagnostics')
    assert.ok(
      diag.events.some((e) => e.owner === 'opponent'),
      `${mode}: P2`,
    )
    const poses = diag.poses,
      frozen = await fixture('snapshot')
    await page.clock.runFor(500)
    assert.deepEqual((await fixture('diagnostics')).poses, poses, `${mode}: active pause`)
    assert.deepEqual(await fixture('snapshot'), frozen)
  }
  await reset('external-object', 'opponent')
  await fixture('act')
  await fixture('advance', 2)
  await fixture('conceal', true)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).visible, 0)
  assert.equal((await fixture('diagnostics')).object, true)
  await fixture('gyo', 'player', true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).visible, 1)
  await reset('external-object')
  await fixture('act')
  await fixture('advance', 5)
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
  assert.equal((await fixture('diagnostics')).object, true)
  assert.deepEqual(errors, [])
  if (positives.every((mode) => Array.isArray(observations[mode]))) {
    await writeFile(
      path.join(output, 'sequence.txt'),
      positives.map((mode) => `file '${mode}.mp4'`).join('\n'),
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
        path.join(output, 'sweet-home.mp4'),
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
          'confirmed body and object transfers',
          'actual damage conserved',
          'right intake only for external wounds',
          'left-hand backlash',
          'no route on absent contact or broken object',
          'no inset for transfers',
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
  process.stdout.write(`Sweet Home presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
