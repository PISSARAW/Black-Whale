import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CHROLLO_OUTPUT ?? path.join(root, 'output/clash-chrollo')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-chrollo/index.html'] },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-chrollo/`)
  await page.waitForFunction(() => window.chrolloFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.chrolloFixture[method](...args), { method, args })
  async function reset(mode, side = 'player') {
    await fixture('reset', mode, side)
    for (let attempt = 0; attempt < 100; attempt++) {
      await page.clock.runFor(50)
      if (await page.locator('.fight-scene.ready').count()) return
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('Chrollo scene did not remount')
  }
  const modes = [
    'book',
    'acquisition',
    'copy',
    'puppet',
    'appearance',
    'cloth',
    'fish',
    'control',
    'detonation',
    'decisive',
  ]
  const selectedModes = process.env.CHROLLO_CAPTURE_MODES?.split(',') ?? modes
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
    let sawMajor = false,
      sawDecisive = false
    const seen = new Set()
    const frames = mode === 'decisive' ? 100 : mode === 'book' ? 55 : 60
    for (let frame = 0; frame < frames; frame++) {
      await fixture('advance', 2)
      await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
      const marker = page.locator('[data-camera-event]')
      const detail = (await marker.count()) ? await marker.getAttribute('data-camera-event') : null
      if (detail?.startsWith('chrollo.')) {
        sawMajor = true
        seen.add(detail)
      }
      if (mode === 'book') assert.equal(detail, null)
      sawDecisive ||= (await page.locator('[data-variant="chrollo-sun-moon"]').count()) > 0
      await page.screenshot({ path: path.join(folder, `${String(frame).padStart(3, '0')}.png`) })
      if (frame === 5 || frame === 20 || frame === 35 || frame === 70)
        await page.screenshot({ path: path.join(output, `${mode}-${frame}.png`) })
    }
    const state = await fixture('snapshot')
    if (mode === 'acquisition') assert.equal(state.opponent.skillHunterStolen.length, 1)
    if (mode === 'copy') assert.ok(state.battlefield.entities.find((e) => e.copy))
    if (mode === 'puppet')
      assert.ok(state.battlefield.entities.find((e) => e.copy?.order === 'attack'))
    if (mode === 'appearance')
      assert.equal(state.player.chrolloHistorical.appearance.model, 'illumi')
    if (mode === 'cloth') assert.equal(state.opponent.clothCapture.owner, 'player')
    if (mode === 'fish') assert.ok(state.player.chrolloHistorical.fish)
    if (mode === 'control') assert.equal(sawMajor, true)
    if (mode === 'detonation') {
      assert.equal(state.opponent.hatsuEffects.sunMark, 0)
      assert.ok(state.opponent.health > 0)
      assert.ok(seen.has('chrollo.detonation'))
    }
    if (mode === 'decisive') {
      assert.equal(sawDecisive, true, 'missing decisive Sun/Moon variant')
      assert.equal(state.winner, 'player')
      assert.equal(state.opponent.health, 0)
    } else if (mode !== 'book') assert.equal(sawMajor, true, `${mode}: missing type 2 shot`)
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
  await reset('acquisition', 'opponent')
  await fixture('act')
  await fixture('advance', 20)
  await page.clock.runFor(300)
  assert.equal((await fixture('snapshot')).player.skillHunterStolen.length, 1)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.clock.runFor(300)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(100)
  assert.equal((await fixture('diagnostics')).visible, false)
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
        path.join(output, 'chrollo.mp4'),
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
          'book type 1 without inset',
          'actual acquisitions and manifestations',
          'Sun/Moon route',
          'decisive knockout',
          'pause',
          'opponent seat',
          '390/320px',
          'reduced motion',
        ],
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Chrollo presentation verified: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
