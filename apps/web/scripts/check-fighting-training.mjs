import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.TRAINING_CHECK_OUTPUT ?? '/tmp/black-whale-training-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-training/index.html'], holdUntilCrawlEnd: false },
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
  const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-training/`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  process.stdout.write('Fixture loaded\n')
  await page.waitForFunction(() => Boolean(window.trainingFixture))
  process.stdout.write('Fixture ready\n')
  const snapshot = () => page.evaluate(() => window.trainingFixture.snapshot())
  await page.getByLabel('P1 aura', { exact: true }).fill('80')
  await page.getByLabel('P1 aura', { exact: true }).press('Tab')
  assert.equal((await snapshot()).player.aura, 80)
  process.stdout.write('Resources checked\n')
  await page.getByRole('button', { name: 'Reset · Coin droit', exact: true }).click()
  assert.equal((await snapshot()).opponent.x, 93)
  process.stdout.write('Reset checked\n')
  await page.getByText('Lire une ouverture perceptible', { exact: true }).click()
  await page.getByLabel('Perception du contre-jeu', { exact: true }).selectOption('opponent')
  await page
    .getByText('Aucune ouverture repérée avec les sens et le Nen actuels.', { exact: true })
    .waitFor()
  await page.getByLabel('Perception du contre-jeu', { exact: true }).selectOption('player')
  await page.getByRole('button', { name: 'Reset · Centre', exact: true }).click()
  await page.getByLabel('Mannequin', { exact: true }).selectOption('guard')
  await page.evaluate(() => window.trainingFixture.advance(20))
  assert.equal((await snapshot()).opponent.blocking, true)
  await page.evaluate(() => window.trainingFixture.advance(12, { right: true }))
  await page.evaluate(() => window.trainingFixture.attack())
  await page.evaluate(() => window.trainingFixture.advance(75))
  assert.equal((await snapshot()).training.measurement.status, 'complete')
  await page.getByText('Essais d’équilibrage · échanges et contre-jeu', { exact: true }).click()
  const study = page.locator('.exchange-study')
  await study.getByLabel('Situation à tester', { exact: true }).selectOption('corner')
  await study.getByRole('button', { name: 'Préparer cet essai', exact: true }).click()
  const corner = await snapshot()
  assert.equal(corner.opponent.x, 93)
  assert.equal(corner.training.settings.dummy.behavior, 'guard-after-hit')
  for (const side of ['player', 'opponent']) {
    assert.equal(corner.training.settings.resources[side].infiniteHealth, false)
    assert.equal(corner.training.settings.resources[side].infiniteAura, false)
    assert.equal(corner[side].aura, 100)
  }
  await study.getByLabel('Situation à tester', { exact: true }).selectOption('preparation')
  await study.getByRole('button', { name: 'Préparer cet essai', exact: true }).click()
  assert.equal((await snapshot()).opponent.hatsuEffects.cyclotronTurns, 0)
  await study.getByLabel('Observation du joueur', { exact: true }).selectOption('unclear')
  await study
    .getByLabel('Actions tentées et résultat', { exact: true })
    .fill('Essai automatisé du carnet ; aucune partie humaine.')
  await study.getByRole('button', { name: 'Consigner cet essai', exact: true }).click()
  const downloadPending = page.waitForEvent('download')
  await study.getByRole('button', { name: 'Exporter les observations (1/40)', exact: true }).click()
  const download = await downloadPending
  await download.saveAs(path.join(output, 'observations.json'))
  const { readFile } = await import('node:fs/promises')
  const observations = JSON.parse(await readFile(path.join(output, 'observations.json'), 'utf8'))
  assert.equal(observations.evidence, 'human-observation')
  assert.equal(observations.notes[0].trial, 'preparation')
  assert.equal(observations.notes[0].lastContact, undefined)
  assert.equal(observations.notes[0].observation, 'unclear')
  await page.getByRole('button', { name: 'Reset · Centre', exact: true }).click()
  await page.getByLabel('Mannequin', { exact: true }).selectOption('guard')
  process.stdout.write('Recovery checked\n')
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const frozen = (await snapshot()).frame
  await page.evaluate(() => window.trainingFixture.advance(10))
  assert.equal((await snapshot()).frame, frozen)
  await page.getByRole('button', { name: 'Avancer de 1 frame', exact: true }).click()
  assert.equal((await snapshot()).frame, frozen + 1)
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click()
  await page.getByRole('button', { name: 'Enregistrer P2', exact: true }).click()
  await page.evaluate(() => window.trainingFixture.advance(12))
  await page.getByRole('button', { name: 'Arrêter l’enregistrement', exact: true }).click()
  assert.equal((await snapshot()).training.recording.duration, 12)
  await page.getByRole('button', { name: 'Lire · 12f', exact: true }).click()
  assert.equal((await snapshot()).training.recording.playing, true)
  await page.getByRole('button', { name: 'Reset · Coin gauche', exact: true }).click()
  assert.equal((await snapshot()).training.recording.playing, false)
  await page.evaluate(() => window.trainingFixture.advance(20))
  await page.evaluate(() => window.trainingFixture.advance(12, { right: true }))
  await page.evaluate(() => window.trainingFixture.attack())
  await page.evaluate(() => window.trainingFixture.advance(75))
  assert.equal((await snapshot()).training.measurement.status, 'complete')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.screenshot({ path: path.join(output, `training-${width}.png`), fullPage: true })
  }
  await page.evaluate(() => window.trainingFixture.english())
  await page.getByRole('button', { name: 'Advance 1 frame', exact: true }).waitFor()
  await study.getByRole('button', { name: 'Prepare this trial', exact: true }).waitFor()
  await study.getByLabel('Trial situation', { exact: true }).selectOption('wakeup')
  await study.getByRole('button', { name: 'Prepare this trial', exact: true }).click()
  assert.equal((await snapshot()).training.settings.dummy.behavior, 'reversal')
  assert.equal((await snapshot()).training.settings.dummy.action, 'light')
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      { screenshots: 3, exchangeTrials: 7, localObservationExport: true, errors },
      null,
      2,
    ),
  )
  process.stdout.write(`Training lab UI passed; ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
