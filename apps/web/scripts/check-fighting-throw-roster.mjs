import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.THROW_ROSTER_OUTPUT ?? '/tmp/black-whale-five-throws'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false, root, publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-throws/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ headless: true, args: [
  '--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = [], samples = []
page.on('pageerror', (error) => errors.push(error.message))
page.setDefaultTimeout(90000)
const reset = (options) => page.evaluate((value) => window.throwFixture.reset(value), options)
const snapshot = () => page.evaluate(() => window.throwFixture.snapshot())
const rendered = () => page.waitForFunction(() => {
  const value = window.throwFixture.snapshot()
  return value.audit?.frame === value.state.frame
})
async function seek(age) {
  await page.evaluate((value) => window.throwFixture.seek(value), age)
  await page.waitForTimeout(240)
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await rendered()
  return snapshot()
}
const pairs = {
  kurapika: ['kurapika-pendulum', 'kurapika-last-link'],
  hisoka: ['hisoka-return', 'hisoka-trapeze'],
  chrollo: ['chrollo-page', 'chrollo-public'],
  benjamin: ['benjamin-restraint', 'benjamin-arrest'],
  tserriednich: ['tserriednich-collection', 'tserriednich-future'],
  feitan: ['feitan-umbrella', 'feitan-wheel'],
  saiyu: ['saiyu-lever', 'saiyu-vault'],
  theta: ['theta-disarm', 'theta-blind-spot'],
  biscuit: ['biscuit-lesson', 'biscuit-correction'],
  phinks: ['phinks-wringer', 'phinks-reverse'],
  franklin: ['franklin-cargo', 'franklin-unload'],
  machi: ['machi-cross-stitch', 'machi-spool'],
  illumi: ['illumi-joint', 'illumi-puppet'],
  kalluto: ['kalluto-screen', 'kalluto-bow'],
  bonolenov: ['bonolenov-waltz', 'bonolenov-prologue'],
  shizuku: ['shizuku-brush', 'shizuku-spring-clean'],
  hinrigh: ['hinrigh-handshake', 'hinrigh-underboss'],
  mizaistom: ['mizaistom-warning', 'mizaistom-custody'],
  leorio: ['leorio-consultation', 'leorio-house-call'],
  hanzo: ['hanzo-blind-side', 'hanzo-moonfall'],
}
try {
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-throws/`)
  await page.waitForSelector('.fight-scene.ready')
  const selected = Object.entries(pairs)
    .filter((_, index) => {
      if (process.env.THROW_ROSTER_BATCH === 'second') return index >= 5 && index < 10
      if (process.env.THROW_ROSTER_BATCH === 'third') return index >= 10 && index < 15
      if (process.env.THROW_ROSTER_BATCH === 'fourth') return index >= 15
      return true
    })
    .filter(([id]) => !process.env.THROW_ROSTER_IDS || process.env.THROW_ROSTER_IDS.split(',').includes(id))
  const entries = process.argv.includes('--ko-only') ? [] : selected
  for (const [id, variants] of entries) {
    for (const side of ['player', 'opponent']) for (const powered of [false, true]) {
      await reset({ id, side, powered })
      for (const [age, phase] of [[2, 'grip'], [9, 'turn'], [16, 'slam'], [22, 'release']]) {
        const value = await seek(age)
        assert.equal(value.audit.performance, variants[Number(powered)])
        assert.equal(value.audit.powered, powered)
        assert.equal(value.audit.phase, phase)
        assert.equal(value.audit.shot, ({ grip: 'grip-detail', turn: 'turn-orbit', slam: 'impact', release: 'aftermath' })[phase])
        assert.equal(value.audit.finite, true)
        if (phase === 'turn' && ['kurapika', 'hisoka'].includes(id))
          assert.ok(value.audit.effects.includes(`throw-signature:${id === 'kurapika' ? 'chain' : 'gum'}`))
        if (phase === 'turn' && id === 'feitan') assert.equal(value.audit.equipment.umbrella, true)
        if (phase === 'turn' && id === 'saiyu') {
          assert.equal(value.audit.equipment.staff, true)
          if (powered) assert.ok(value.audit.equipment.staffBottom > -0.04)
        }
        if (phase === 'turn' && id === 'theta') assert.equal(value.audit.equipment.holstered, true)
        if (phase === 'turn' && powered && ['feitan', 'saiyu'].includes(id))
          assert.ok(value.audit.origins[side === 'player' ? 0 : 1][1] > 0.4)
        if (phase === 'turn' && powered && id === 'feitan') assert.ok(value.audit.scissorsGap < 0.3, `Scissor contact error: ${value.audit.scissorsGap}`)
        if (phase === 'turn' && ['machi', 'kalluto', 'illumi'].includes(id)) {
          const effect = { machi: 'thread', kalluto: 'paper', illumi: 'needles' }[id]
          assert.ok(value.audit.effects.includes(`throw-signature:${effect}`))
        }
        if (phase === 'turn' && ['hinrigh', 'mizaistom'].includes(id))
          assert.ok(value.audit.effects.includes(`throw-signature:${id === 'hinrigh' ? 'cuffs' : 'referee'}`))
        if (phase === 'turn' && id === 'shizuku') assert.equal(value.audit.equipment.blinky, true)
        if (phase === 'turn' && id === 'leorio' && powered) assert.ok(value.audit.effects.includes('throw-signature:remote'))
        if (phase === 'turn' && id === 'hanzo' && powered) assert.ok(value.audit.scissorsGap < 0.3)
        if (phase === 'release') assert.ok(value.audit.bodies[side === 'player' ? 1 : 0][0] < -1.2)
        await page.screenshot({ path: path.join(output, `${id}-${powered ? 'super' : 'normal'}-${side}-${phase}.png`) })
        samples.push({ id, side, powered, phase, audit: value.audit })
      }
    }
    await page.setViewportSize({ width: 320, height: 720 })
    await reset({ id, side: 'opponent', powered: true })
    const portrait = await seek(9)
    assert.equal(portrait.audit.finite, true)
    await page.screenshot({ path: path.join(output, `${id}-mobile-320.png`) })
    await page.setViewportSize({ width: 1280, height: 720 })
  }
  for (const side of ['player', 'opponent']) {
    await reset({ id: 'biscuit', side, powered: true, trueForm: true })
    const adult = await seek(9)
    assert.equal(adult.audit.equipment.trueForm, true)
    assert.equal(adult.audit.performance, 'biscuit-correction')
    await page.screenshot({ path: path.join(output, `biscuit-true-form-${side}.png`) })
  }
  for (const side of ['player', 'opponent']) {
    await reset({ id: 'bonolenov', side, powered: true, prologue: true })
    const armed = await seek(9)
    assert.equal(armed.audit.performance, 'bonolenov-prologue')
    assert.equal(armed.audit.equipment.spear, true)
    await page.screenshot({ path: path.join(output, `bonolenov-prologue-${side}.png`) })
  }
  await reset({ id: 'bonolenov', powered: true })
  assert.equal((await seek(9)).audit.equipment.spear, false)
  await reset({ id: 'machi', sealed: true })
  assert.equal((await seek(9)).audit.performance, null)
  await reset({ id: 'kalluto', confiscated: true })
  assert.ok(!(await seek(9)).audit.effects.includes('throw-signature:paper'))
  await reset({ id: 'illumi', noNeedles: true })
  assert.ok(!(await seek(9)).audit.effects.includes('throw-signature:needles'))
  await reset({ id: 'shizuku', sealed: true })
  const noBlinky = await seek(9)
  assert.equal(noBlinky.audit.performance, null)
  assert.equal(noBlinky.audit.equipment.blinky, false)
  await reset({ id: 'hinrigh', confiscated: true })
  assert.ok(!(await seek(9)).audit.effects.includes('throw-signature:cuffs'))
  await reset({ id: 'mizaistom', sealed: true })
  const noCard = await seek(9)
  assert.equal(noCard.audit.performance, 'mizaistom-warning')
  assert.ok(!noCard.audit.effects.includes('throw-signature:referee'))
  await reset({ id: 'leorio', sealed: true })
  const doctor = await seek(9)
  assert.equal(doctor.audit.performance, 'leorio-consultation')
  assert.ok(!doctor.audit.effects.includes('throw-signature:remote'))
  await reset({ id: 'feitan', confiscated: true })
  assert.equal((await seek(9)).audit.equipment.umbrella, false)
  await reset({ id: 'saiyu', sealed: true })
  const sealed = await seek(9)
  assert.equal(sealed.audit.performance, null)
  assert.equal(sealed.audit.equipment.staff, false)
  await reset({ id: 'theta', powered: true })
  await seek(9)
  assert.equal((await snapshot()).audit.equipment.holstered, true)
  await page.evaluate(() => window.throwFixture.end())
  await rendered()
  assert.equal((await snapshot()).audit.equipment.holstered, false)
  await reset({ id: 'hisoka', powered: true })
  await seek(9)
  const frozen = await snapshot()
  await page.evaluate(() => window.throwFixture.pause(true))
  await page.waitForTimeout(300)
  assert.deepEqual((await snapshot()).state, frozen.state)
  await page.evaluate(() => window.throwFixture.pause(false))
  await reset({ id: 'kurapika', powered: true, ko: true, freezeKO: true })
  await seek(0)
  await page.waitForFunction(() => window.throwFixture.snapshot().audit?.phase === 'turn')
  const ko = await snapshot()
  assert.ok(ko.audit.origins[1][1] > 0.4, 'A KO victim must still follow the cinematic lift')
  await page.screenshot({ path: path.join(output, 'kurapika-super-ko-turn.png') })
  await page.evaluate(() => window.throwFixture.pause(false))
  await page.waitForSelector('[data-victory-cinematic]')
  await reset({ id: 'hisoka', powered: true })
  await page.evaluate(() => window.throwFixture.end())
  await rendered()
  assert.equal((await snapshot()).audit.effects.length, 0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reset({ id: 'hisoka', powered: true })
  assert.equal((await seek(9)).audit.performance, null)
  assert.equal((await snapshot()).audit.effects.length, 0)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ samples, errors }, null, 2))
  console.log(`Verified ${samples.length} production frames, ${entries.length} mobile views, pause, KO and reduced motion.`)
} catch (error) {
  await writeFile(path.join(output, 'failure.json'), JSON.stringify({ error: String(error), errors, value: await snapshot() }, null, 2))
  await page.screenshot({ path: path.join(output, 'failure.png') })
  throw error
} finally { await browser.close(); await server.close() }
