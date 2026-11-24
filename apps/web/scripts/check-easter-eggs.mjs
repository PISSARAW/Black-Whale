import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.EASTER_EGG_CHECK_OUTPUT ?? '/tmp/black-whale-easter-eggs-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/easter-eggs/index.html'], holdUntilCrawlEnd: false },
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
  const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/easter-eggs/`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  process.stdout.write('Fixture loaded\n')
  await page.waitForFunction(() => Boolean(window.easterEggFixture))
  process.stdout.write('Fixture ready\n')
  await page.locator('.easter-eggs summary').click()
  await page.getByRole('button', { name: 'P1 · Au bout des doigts', exact: true }).click()
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().egg.slot), 1)
  await page.evaluate(() => window.easterEggFixture.advance(90))
  await page
    .getByRole('button', { name: 'Aperçu · Au bout des doigts', exact: true })
    .first()
    .click()
  await page.getByLabel('Aperçu de la scène').waitFor()
  await page.getByRole('button', { name: 'Fermer l’aperçu', exact: true }).click()
  const playerPanel = page.getByRole('region', { name: 'Hisoka · Easter Eggs' }).first()
  await playerPanel.getByRole('combobox').selectOption('F7')
  await page.locator('.easter-eggs summary').focus()
  await page.locator('.easter-eggs summary').evaluate((node) => node.blur())
  await page.keyboard.down('d')
  await page.keyboard.press('F7')
  await page.keyboard.up('d')
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().egg.slot), 2)
  await page.evaluate(() => window.easterEggFixture.advance(84))
  await page.keyboard.down('q')
  await page.keyboard.press('F7')
  await page.keyboard.up('q')
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().egg.slot), 3)
  await page.evaluate(() => window.easterEggFixture.advance(150))
  await page.keyboard.down('s')
  await page.keyboard.press('F7')
  await page.keyboard.up('s')
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().egg.slot), 4)
  await page.evaluate(() => window.easterEggFixture.advance(180))
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().discoveries.hisoka), 15)
  await page.reload()
  await page.waitForFunction(() => Boolean(window.easterEggFixture))
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().discoveries.hisoka), 15)
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().keys.player), 'F7')
  await page.evaluate(() => window.easterEggFixture.pause(true))
  await page.keyboard.press('F7')
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().egg), undefined)
  await page.evaluate(() => window.easterEggFixture.pause(false))
  await page.keyboard.press('8')
  assert.equal(await page.evaluate(() => window.easterEggFixture.current().opponentEgg.slot), 1)
  const roster = await page.evaluate(() => window.easterEggFixture.roster())
  assert.equal(roster.length, 40)
  const mobileCaptures = new Set([
    'hisoka',
    'chrollo',
    'theta',
    'biscuit',
    'kalluto',
    'mizaistom',
    'beyond',
    'yokotani',
  ])
  let sceneCases = 0
  let sceneScreenshots = 0
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    for (const id of roster) {
      for (const slot of width === 1440 ? [1, 2, 3, 4] : [4]) {
        const shown = await page.evaluate(
          ([id, slot]) => window.easterEggFixture.showCase(id, slot),
          [id, slot],
        )
        assert.equal(shown.fighter, id)
        assert.equal(shown.egg?.slot, slot)
        sceneCases++
        await page.locator('.easter-eggs').evaluate((node) => {
          node.open = true
        })
        await page.waitForSelector('canvas')
        await page.waitForFunction(() => {
          const canvas = document.querySelector('canvas')
          return canvas && canvas.width !== 300 && canvas.height !== 150
        })
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        )
        assert.deepEqual(errors, [])
        assert.equal(await page.locator('.fight-scene.failed').count(), 0)
        assert.ok((await page.locator('.egg-caption p').textContent()).length > 0)
        if ((width === 1440 && slot === 4) || (width !== 1440 && mobileCaptures.has(id))) {
          await page.screenshot({
            path: path.join(output, `${id}-${slot}-${width}.png`),
            fullPage: true,
          })
          sceneScreenshots++
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        )
      }
    }
  }
  await page.evaluate(() => window.easterEggFixture.showCase('rihan', 4, 'en'))
  await page.getByText('Insufficient information.', { exact: true }).waitFor()
  await page.evaluate(() => window.easterEggFixture.showCase('yokotani', 4, 'en'))
  await page
    .getByText('The stamp returns to the same sheet, still on the wrong side.', { exact: true })
    .waitFor()
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ fighters: roster.length, sceneCases, sceneScreenshots, errors }, null, 2),
  )
  process.stdout.write(
    `Easter Eggs UI: controls, previews, collection, reload and ${sceneCases} scene cases / ${sceneScreenshots} screenshots passed; ${output}\n`,
  )
} finally {
  await browser.close()
  await server.close()
}
