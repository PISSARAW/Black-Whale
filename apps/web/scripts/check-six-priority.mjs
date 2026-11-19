import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/clash-six-priority')
const extra = process.argv.includes('--multi-combat')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-six-priority/index.html'] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = [],
  observations = {}
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.setDefaultTimeout(120000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-six-priority/`,
  )
  await page.waitForFunction(() => window.sixPriorityFixture)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.sixPriorityFixture[method](...args), {
      method,
      args,
    })
  for (const mode of extra
    ? ['bonolenov', 'illumi']
    : ['hinrigh', 'chrollo', 'halkenburg', 'kurapika', 'machi', 'luini']) {
    await fixture('scenario', mode)
    await page.locator('.fight-scene.ready').waitFor()
    await page.waitForFunction(
      () =>
        window.sixPriorityFixture.diagnostics().names.length > 0 ||
        window.sixPriorityFixture.snapshot().player.halkenburgOrigin,
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    const state = await fixture('snapshot'),
      audit = await fixture('diagnostics')
    assert.equal(audit.finite, true)
    if (mode === 'hinrigh') assert.ok(audit.names.includes('biohazard-camera'))
    if (mode === 'chrollo' || mode === 'kurapika')
      assert.ok(
        audit.names.some((name) => name.startsWith('roster-guest:')),
        `${mode}: third body rendered`,
      )
    if (mode === 'halkenburg') assert.equal(state.player.halkenburgOrigin, 'halkenburg')
    if (mode === 'luini') assert.ok(audit.names.includes('luini-aperture:player'))
    if (mode === 'bonolenov') {
      assert.equal(state.player.battleCantabile.form.model, 'lynch')
      assert.ok(audit.names.includes('manga-head:lynch-fullbokko'))
      await page.getByRole('button', { name: /Metamorphosen · Zakuro/ }).click()
      assert.equal((await fixture('snapshot')).player.battleCantabile.selectedModel, 'zakuro')
      assert.equal((await fixture('snapshot')).player.battleCantabile.form.model, 'lynch')
    }
    if (mode === 'illumi') {
      assert.equal(
        state.battlefield.entities.find((body) => body.id === 'player:corpse').controller?.source,
        'illumi',
      )
      assert.ok(audit.names.includes('prepared:player:corpse'))
      assert.ok(state.player.heardCorpse)
      assert.ok(
        Math.abs(audit.corpses.find((body) => body.id === 'prepared:player:corpse').rotation) < 0.1,
      )
      await fixture('command', 'illumi-corpse-order', 'player:corpse|approach')
      await fixture('advance', 20)
      await page
        .getByRole('button', { name: 'Illumi · Retirer les aiguilles du cadavre', exact: true })
        .click()
      await page.waitForFunction(() =>
        window.sixPriorityFixture
          .diagnostics()
          .corpses.some((body) => body.id === 'prepared:player:corpse' && body.rotation > 1),
      )
      assert.equal(
        (await fixture('snapshot')).battlefield.entities.find((body) => body.id === 'player:corpse')
          .controller,
        undefined,
      )
    }
    observations[mode] = {
      player: state.player.id,
      guests: state.rosterGuests?.map((guest) => guest.fighter.id),
      ...audit,
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: path.join(output, `${mode}.png`) })
    if (extra) {
      await page.setViewportSize({ width: 390, height: 844 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: path.join(output, `${mode}-mobile.png`) })
      await page.setViewportSize({ width: 1280, height: 900 })
    }
  }
  await fixture('scenario', 'chrollo')
  await page.locator('.fight-scene.ready').waitFor()
  await page.getByRole('button', { name: 'Pantin · Garder', exact: true }).click()
  assert.equal((await fixture('snapshot')).player.blackOrder, 'guard')
  await page.setViewportSize({ width: 390, height: 844 })
  await fixture('reduced')
  await page.screenshot({ path: path.join(output, 'mobile.png') })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, extra ? 'multi-report.json' : 'report.json'),
    JSON.stringify({ errors, observations }, null, 2),
  )
  process.stdout.write(`${JSON.stringify({ output, observations })}\n`)
} finally {
  await browser?.close()
  await server.close()
}
