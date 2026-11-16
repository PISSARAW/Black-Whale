import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PROGRESSION_CHECK_OUTPUT ?? '/tmp/black-whale-progression-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-progression/index.html'], holdUntilCrawlEnd: false },
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
  const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-progression/`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  process.stdout.write('Fixture loaded\n')
  await page.waitForFunction(() => Boolean(window.progressionFixture))
  process.stdout.write('Fixture ready\n')
  const snapshot = () => page.evaluate(() => window.progressionFixture.snapshot())
  await page.locator('.lessons-launcher summary').click()
  assert.equal(await page.locator('.lesson-list button').count(), 15)
  await page.getByRole('button', { name: /5\. Ten/ }).click()
  await page.evaluate(() => window.progressionFixture.advance(61))
  await page.locator('.lesson-panel').getByText('Exercice réussi.', { exact: true }).waitFor()
  await page.locator('.practice-hub summary').click()
  await page.getByRole('button', { name: 'Repérer In avec Gyo', exact: true }).click()
  await page.evaluate(() => window.progressionFixture.advance(40, { gyo: true }))
  await page.getByRole('status').filter({ hasText: 'Défi réussi.' }).waitFor()
  const recordedHash = (await snapshot()).hash
  await page.locator('.capture-bar button').click()
  await page.getByText('Replay ajouté à la bibliothèque.', { exact: true }).waitFor()
  await page.locator('.fight-replays summary').click()
  await page.getByRole('button', { name: 'Lire ce replay', exact: true }).click()
  await page.evaluate(() => window.progressionFixture.advance(100))
  await page.getByText('Fin du replay · états vérifiés.', { exact: true }).waitFor()
  assert.equal((await snapshot()).hash, recordedHash)
  await page.getByRole('button', { name: 'Quitter le replay', exact: true }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter', exact: true }).click()
  const download = await downloadEvent
  assert.match(download.suggestedFilename(), /\.bw-replay\.json$/)
  const replayFile = path.join(output, 'roundtrip.bw-replay.json')
  await download.saveAs(replayFile)
  await page.locator('.fight-replays input[type=file]').setInputFiles(replayFile)
  await page.waitForFunction(() => window.progressionFixture.snapshot().library === 2)
  await page.evaluate(() => window.progressionFixture.advance(100))
  await page.getByText('Fin du replay · états vérifiés.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Quitter le replay', exact: true }).click()
  await page.getByRole('button', { name: 'Lancer le parcours avec kurapika', exact: true }).click()
  assert.equal((await snapshot()).state.opponent.id, 'hisoka')
  await page.evaluate(() => window.progressionFixture.winMatch())
  await page.getByRole('button', { name: 'Rencontre suivante', exact: true }).click()
  assert.equal((await snapshot()).state.opponent.id, 'franklin')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.screenshot({ path: path.join(output, `progression-${width}.png`), fullPage: true })
  }
  await page.evaluate(() => window.progressionFixture.english())
  await page
    .locator('.practice-hub summary')
    .getByText('Challenges and Arcade route', { exact: true })
    .waitFor()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.progressionFixture?.snapshot().library === 2)
  assert.deepEqual(errors, [])
  process.stdout.write(`Progression UI passed; ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
