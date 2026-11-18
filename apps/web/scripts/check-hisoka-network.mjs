import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/clash-hisoka-network')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-hisoka-network/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-hisoka-network/`,
  )
  await page.waitForFunction(() => window.hisokaNetworkFixture)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.hisokaNetworkFixture[method](...args), {
      method,
      args,
    })
  async function ready() {
    await page.locator('.fight-scene.ready').waitFor()
    await page.waitForFunction(() => window.hisokaNetworkFixture.diagnostics().visible > 0)
  }
  for (const mode of ['network', 'ceiling', 'card']) {
    await fixture('scenario', mode)
    await ready()
    const state = await fixture('snapshot')
    const audit = await fixture('diagnostics')
    assert.equal(audit.finite, true)
    assert.equal(audit.visible, audit.count, `${mode}: every link is rendered`)
    if (mode === 'network') assert.equal(audit.count, 3)
    if (mode === 'ceiling') assert.ok(state.player.y > 8)
    if (mode === 'card') {
      assert.equal(state.projectiles.length, 1)
      const id = state.projectiles[0].id
      await fixture('command', 'gum-recall')
      await fixture('advance', 65)
      const returned = await fixture('snapshot')
      assert.equal(returned.projectiles[0].id, id)
      assert.equal(returned.projectiles[0].gumFlight.mode, 'held')
      await fixture('command', 'gum-rethrow')
      await fixture('advance', 12)
      assert.equal((await fixture('snapshot')).projectiles[0].id, id)
    }
    observations[mode] = { y: state.player.y, ...audit }
    await page.screenshot({ path: path.join(output, `${mode}.png`) })
  }
  await fixture('scenario', 'network')
  await ready()
  await page.getByRole('group', { name: 'Bungee Gum en combat' }).locator('summary').click()
  await page.getByLabel('Origine des prochaines attaches').selectOption('foot-right')
  assert.equal((await fixture('snapshot')).gumNetwork.limbs.player, 'foot-right')
  await page.screenshot({ path: path.join(output, 'controls.png') })
  await page.setViewportSize({ width: 390, height: 844 })
  await fixture('reduced')
  await page.screenshot({ path: path.join(output, 'mobile.png') })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ errors, observations }, null, 2),
  )
  process.stdout.write(`${JSON.stringify({ output, observations })}\n`)
} finally {
  await browser?.close()
  await server.close()
}
