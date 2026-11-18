import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.BODY_HATSU_OUTPUT ?? path.join(root, 'output/clash-body-hatsu')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-body-hatsu/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-body-hatsu/`,
  )
  await page.waitForFunction(() => window.bodyHatsuFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.bodyHatsuFixture[method](...args), {
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
    throw new Error('Body Hatsu scene did not remount')
  }

  const modes = ['gel', 'hammer', 'drill', 'axe', 'restore', 'leorio']
  const selectedModes = process.env.BODY_HATSU_CAPTURE_MODES?.split(',').filter(Boolean) ?? modes
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
    const folder = path.join(output, mode)
    await mkdir(folder, { recursive: true })
    await fixture('act')
    const seen = new Set()
    for (let frame = 0; frame < 45; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      assert.equal(await page.locator('[data-camera-event]').count(), 0, `${mode}: no inset`)
      const audit = await fixture('diagnostics')
      if (audit.events?.gel !== null && audit.events?.gel !== undefined) seen.add('arm accent')
      if (audit.events?.tool !== null && audit.events?.tool !== undefined) seen.add('tool accent')
      if (audit.arm) seen.add('physical arm')
      if (audit.toolVisible) seen.add(audit.tool)
      if (audit.stage) seen.add(audit.stage)
      if (audit.fist) seen.add('fist')
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if ([3, 8, 14, 22].includes(frame))
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot')
    if (mode === 'gel') {
      assert.ok(seen.has('arm accent'))
      assert.ok(seen.has('physical arm'))
    } else if (mode === 'leorio') {
      for (const key of ['transmission', 'emergence', 'fist']) assert.ok(seen.has(key), key)
      assert.equal(state.nextProjectileId, 2)
    } else {
      assert.ok(seen.has('tool accent'))
      if (mode === 'restore') assert.equal(state.player.padailleTool, undefined)
      else assert.equal(state.player.padailleTool, mode)
    }
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
  await reset('leorio', 'opponent')
  await fixture('conceal', true)
  await fixture('act')
  await fixture('launch')
  await page.clock.runFor(50)
  const hidden = await fixture('snapshot')
  assert.equal(hidden.projectiles[0].owner, 'opponent')
  assert.equal(hidden.projectiles[0].concealed, true)
  assert.equal((await fixture('diagnostics')).path, true)
  await fixture('view', 'player')
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).path, false)
  await fixture('conceal', true, true)
  await page.clock.runFor(50)
  assert.equal((await fixture('diagnostics')).path, true)
  await reset('drill', 'opponent')
  await fixture('act')
  await fixture('advance', 5)
  await page.clock.runFor(50)
  const pausedPose = await fixture('diagnostics')
  await page.clock.runFor(500)
  assert.equal((await fixture('diagnostics')).toolTurn, pausedPose.toolTurn)
  assert.equal((await fixture('diagnostics')).toolScale, pausedPose.toolScale)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(100)
  const reduced = await fixture('diagnostics')
  assert.equal(reduced.accent, false)
  assert.equal(reduced.toolScale, 1)
  assert.equal(reduced.toolVisible, true)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.clock.runFor(100)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
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
        path.join(output, 'body-hatsu.mp4'),
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
          'actual transformations',
          'right hand',
          'no inset',
          'transmission and emergence',
          'pause',
          'P2',
          'In/Gyo',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Body Hatsu presentation verified: ${output}\n`)
} catch (error) {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`)
  throw error
} finally {
  await browser?.close()
  await server.close()
}
