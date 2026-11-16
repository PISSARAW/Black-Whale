import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.READABILITY_CHECK_OUTPUT ?? '/tmp/black-whale-readability-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-readability/index.html'], holdUntilCrawlEnd: false },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'],
})
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.setDefaultTimeout(60000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(`${error.message}\n`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') process.stderr.write(`${message.text()}\n`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) process.stderr.write(`${response.status()} ${response.url()}\n`)
  })
  const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-readability/`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  process.stdout.write('Fixture loaded\n')
  await page.waitForFunction(() => Boolean(window.readabilityFixture))
  process.stdout.write('Fixture ready\n')
  const snapshot = () => page.evaluate(() => window.readabilityFixture.snapshot())
  const special = page.locator('.touch-controls button').filter({ hasText: 'Jouer de la flûte' })
  await special.click()
  await page.getByRole('status').filter({ hasText: 'Équipement requis absent' }).waitFor()
  process.stdout.write('Refusal checked\n')
  assert.equal((await snapshot()).state.player.aura, 100)
  assert.equal((await snapshot()).state.player.attack, null)
  const attempts = (await snapshot()).state.commandFeedback.player.sequence
  const box = await special.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  assert.equal((await snapshot()).input.hatsu, true)
  await special.dispatchEvent('pointercancel', { pointerId: 1 })
  await page.mouse.up()
  assert.equal((await snapshot()).input.hatsu, false)
  assert.equal((await snapshot()).state.commandFeedback.player.sequence, attempts)
  await special.focus()
  await page.keyboard.press('Space')
  assert.equal((await snapshot()).state.commandFeedback.player.sequence, attempts + 1)
  await special.evaluate((button) => button.click())
  assert.equal((await snapshot()).state.commandFeedback.player.sequence, attempts + 2)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.mouse.up()
  assert.equal((await snapshot()).input.hatsu, false)
  assert.equal((await snapshot()).state.commandFeedback.player.sequence, attempts + 2)
  const ears = page.getByRole('button', { name: 'Se couvrir les oreilles', exact: true })
  const earsBox = await ears.boundingBox()
  await page.mouse.move(earsBox.x + earsBox.width / 2, earsBox.y + earsBox.height / 2)
  await page.mouse.down()
  await page.evaluate(() => window.readabilityFixture.advance(1))
  await page.evaluate(() => window.readabilityFixture.attack('light'))
  await page.getByRole('status').filter({ hasText: 'Mains occupées' }).waitFor()
  await ears.dispatchEvent('pointercancel', { pointerId: 1 })
  await page.mouse.up()
  await page.evaluate(() => window.readabilityFixture.advance(1))
  assert.equal((await snapshot()).state.player.coveringEars, false)
  await page.getByText('Affichage', { exact: true }).click()
  process.stdout.write('Comfort panel opened\n')
  await page.getByLabel('Secousses', { exact: true }).selectOption('0')
  await page.getByLabel('Flashs d’impact', { exact: true }).uncheck()
  await page.getByLabel('Contraste renforcé', { exact: true }).check()
  assert.deepEqual((await snapshot()).comfort, { shake: 0, flashes: false, highContrast: true })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => Boolean(window.readabilityFixture))
  await page.waitForFunction(() => window.readabilityFixture.snapshot().comfort.highContrast)
  assert.deepEqual((await snapshot()).comfort, { shake: 0, flashes: false, highContrast: true })
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.screenshot({ path: path.join(output, `readability-${width}.png`), fullPage: true })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByText('Affichage', { exact: true }).click()
  assert.equal(await page.getByLabel('Secousses', { exact: true }).isDisabled(), true)
  assert.equal(await page.getByLabel('Flashs d’impact', { exact: true }).isDisabled(), true)
  assert.equal((await snapshot()).comfort.shake, 0)
  assert.equal((await snapshot()).comfort.flashes, false)
  await page.evaluate(() => window.readabilityFixture.english())
  await page.getByText('Visual comfort', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  process.stdout.write(`Readability UI passed; ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
