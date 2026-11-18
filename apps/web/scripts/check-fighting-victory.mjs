import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-victory-integration')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-victory/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
})
const errors = [],
  results = []
const matchups = [
  ['hisoka', 'franklin', 'heavens-arena', 'player'],
  ['chrollo', 'hisoka', 'whale-hold', 'opponent'],
  ['kurapika', 'marayam', 'banquet-hall', 'player'],
  ['kurapika', 'chrollo', 'vip-casino', 'opponent'],
  ['feitan', 'chrollo', 'heavens-arena', 'opponent'],
  ['phinks', 'biscuit', 'screening-room', 'player'],
  ['franklin', 'kurapika', 'whale-hold', 'opponent'],
  ['benjamin', 'tserriednich', 'benjamin-salon', 'player'],
  ['tserriednich', 'hisoka', 'vip-casino', 'opponent'],
  ['leorio', 'franklin', 'banquet-hall', 'player'],
  ['halkenburg', 'biscuit', 'halkenburg-salon', 'opponent'],
  ['camilla', 'chrollo', 'camilla-salon', 'player'],
  ['kalluto', 'franklin', 'vip-casino', 'opponent'],
  ['machi', 'hisoka', 'banquet-hall', 'player'],
  ['shizuku', 'franklin', 'heavens-arena', 'opponent'],
  ['bonolenov', 'hisoka', 'whale-hold', 'player'],
  ['illumi', 'franklin', 'vip-casino', 'opponent'],
  ['biscuit', 'hisoka', 'heavens-arena', 'player'],
  ['saiyu', 'hisoka', 'heavens-arena', 'opponent'],
  ['melody', 'chrollo', 'banquet-hall', 'player'],
  ['hanzo', 'benjamin', 'whale-hold', 'opponent'],
  ['bill', 'benjamin', 'banquet-hall', 'player'],
  ['hinrigh', 'padaille', 'vip-casino', 'player'],
  ['terebellum', 'hinrigh', 'whale-hold', 'opponent'],
  ['voconte', 'terebellum', 'whale-hold', 'player'],
  ['longhi', 'franklin', 'whale-hold', 'opponent'],
  ['furykov', 'hisoka', 'screening-room', 'player'],
  ['sayird', 'hisoka', 'whale-hold', 'opponent'],
  ['theta', 'rihan', 'vip-casino', 'opponent'],
  ['mizaistom', 'zakuro', 'supreme-court', 'player'],
  ['rihan', 'shizuku', 'whale-hold', 'opponent'],
  ['zakuro', 'luini', 'whale-hold', 'player'],
  ['lynch', 'hisoka', 'vip-casino', 'opponent'],
  ['luini', 'hinrigh', 'whale-hold', 'player'],
  ['basho', 'yokotani', 'whale-hold', 'opponent'],
]
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', (error) => {
    errors.push(error.message)
    console.error(error)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
      console.error(message.text())
    }
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-victory/`)
  await page.waitForFunction(() => window.victoryFixture)
  assert.deepEqual(
    [...new Set(matchups.map(([winner]) => winner))].sort(),
    (await page.evaluate(() => window.victoryFixture.fighters())).sort(),
    'Every registered cinematic must have a browser integration check',
  )
  for (const [winner, target, stage, side] of [
    ...matchups,
    ['hisoka', 'hisoka', 'observation-deck', 'opponent'],
  ]) {
    await page.evaluate((options) => window.victoryFixture.configure(options), {
      winner,
      target,
      stage,
      side,
      preview: true,
    })
    await page.waitForFunction(() => window.victoryFixture.snapshot().ready)
    await page.evaluate(() => window.victoryFixture.finish())
    const before = await page.evaluate(() => window.victoryFixture.snapshot().state)
    for (const elapsed of [2.5, 4.7, 8, 9.4]) {
      await page.evaluate((t) => window.victoryFixture.pose(t), elapsed)
      await page.waitForTimeout(150)
      await page.screenshot({ path: path.join(output, `${winner}-${target}-${elapsed}.png`) })
    }
    assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().state), before)
    results.push({ winner, target, stage, side })
    process.stdout.write(`Rendered ${winner} against ${target} in ${stage} (${side})\n`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate((options) => window.victoryFixture.configure(options), {
    winner: 'phinks',
    target: 'marayam',
    stage: 'screening-room',
    preview: true,
  })
  await page.waitForFunction(() => window.victoryFixture.snapshot().ready)
  await page.evaluate(async () => {
    await window.victoryFixture.finish()
    await window.victoryFixture.pose(4.5)
  })
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(output, 'mobile-phinks-marayam.png') })
  // Real FightStage: automatic playback, delayed results, pause, skip and no retrigger.
  await page.setViewportSize({ width: 1280, height: 800 })
  for (const [winner, target, stage, side] of matchups) {
    await page.evaluate((options) => window.victoryFixture.configure(options), {
      winner,
      target,
      stage,
      side,
    })
    await page.locator('.fight-scene.ready').waitFor()
    await page.evaluate(() => window.victoryFixture.finish())
    const live = page.locator('[data-victory-cinematic]')
    await live.waitFor()
    assert.equal(await live.getAttribute('data-winner'), winner)
    assert.equal(await live.getAttribute('data-target'), target)
    assert.equal(await live.getAttribute('data-stage'), stage)
    const variant = await live.getAttribute('data-variant')
    if (winner === 'kurapika')
      assert.equal(variant, target === 'chrollo' ? 'kurapika-troupe' : 'kurapika-judgment')
    const soundtrackId = variant || winner
    await page.waitForFunction(
      () =>
        Number(document.querySelector('[data-victory-cinematic]')?.getAttribute('data-elapsed')) >
        0,
    )
    const audio = page.locator('audio').last()
    await page.waitForFunction(
      (soundtrackId) =>
        [...document.querySelectorAll('audio')].some((audio) =>
          audio.src.endsWith(`/clash-victories/${soundtrackId}.m4a`),
        ),
      soundtrackId,
    )
    const soundtrack = await page.request.get(
      new URL(await audio.getAttribute('src'), page.url()).href,
    )
    assert.equal(soundtrack.status(), 200, `${winner}: soundtrack must be served`)
    await page.keyboard.press('Escape')
    await live.waitFor({ state: 'detached' })
    assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
    await page.getByRole('button', { name: /Rejouer|Revanche/i }).waitFor()
    process.stdout.write(`Verified automatic victory and audio: ${winner}\n`)
  }
  await page.evaluate((options) => window.victoryFixture.configure(options), {
    winner: 'hisoka',
    target: 'chrollo',
  })
  await page.waitForSelector('canvas')
  await page.locator('.fight-scene.ready').waitFor()
  await page.evaluate(() => window.victoryFixture.finish())
  const overlay = page.locator('[data-victory-cinematic]')
  await overlay.waitFor()
  await page.waitForTimeout(700)
  const time = Number(await overlay.getAttribute('data-elapsed'))
  assert.ok(time > 0 && time < 3, `Elapsed ${time}`)
  await page.evaluate(() => window.victoryFixture.pause(true))
  const pausedTime = Number(await overlay.getAttribute('data-elapsed'))
  await page.waitForTimeout(350)
  assert.equal(Number(await overlay.getAttribute('data-elapsed')), pausedTime)
  await page.evaluate(() => window.victoryFixture.pause(false))
  await page.keyboard.press('Escape')
  await overlay.waitFor({ state: 'detached' })
  await page.waitForTimeout(300)
  assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
  assert.equal((await page.getByRole('button', { name: /Rejouer|Revanche/i }).count()) > 0, true)
  // A fresh AI duel completes by itself after ten seconds, with the same verdict and arena.
  await page.evaluate((options) => window.victoryFixture.configure(options), {
    winner: 'chrollo',
    target: 'franklin',
    side: 'opponent',
    stage: 'heavens-arena',
    mode: 'versus-ai',
  })
  await page.locator('.fight-scene.ready').waitFor()
  await page.evaluate(() => window.victoryFixture.finish())
  await overlay.waitFor()
  const outcome = await page.evaluate(() => window.victoryFixture.snapshot().state)
  assert.equal(await overlay.getAttribute('data-winner'), 'chrollo')
  assert.equal(await overlay.getAttribute('data-target'), 'franklin')
  assert.equal(await overlay.getAttribute('data-stage'), 'heavens-arena')
  // Hiding the document pauses both the presentation clock and the audio.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(100)
  const hiddenTime = await overlay.getAttribute('data-elapsed')
  await page.waitForTimeout(350)
  assert.equal(await overlay.getAttribute('data-elapsed'), hiddenTime)
  assert.equal(
    await page
      .locator('audio')
      .last()
      .evaluate((audio) => audio.paused),
    true,
  )
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await overlay.waitFor({ state: 'detached', timeout: 20000 })
  assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().state), outcome)
  assert.equal((await page.getByRole('button', { name: /Rejouer|Revanche/i }).count()) > 0, true)
  // A machine without WebGL can still reach the ordinary match result.
  const fallback = await browser.newPage()
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.startsWith('webgl') ? null : original.call(this, kind, ...args)
    }
  })
  await fallback.goto(page.url())
  await fallback.waitForFunction(() => window.victoryFixture)
  await fallback.waitForTimeout(1000)
  await fallback.evaluate(() => window.victoryFixture.finish())
  await fallback.getByRole('button', { name: /Rejouer|Revanche/i }).waitFor()
  assert.equal(await fallback.locator('[data-victory-cinematic]').count(), 0)
  await fallback.close()
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  process.stdout.write(`Victory integration passed. Artifacts: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
