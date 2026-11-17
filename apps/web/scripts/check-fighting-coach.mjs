import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build, preview } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.COACH_CHECK_OUTPUT ?? '/tmp/black-whale-step5-browser'
await mkdir(output, { recursive: true })
const config = {
  configFile: false,
  root,
  publicDir: false,
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
  build: {
    outDir: path.join(output, 'bundle'),
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'ui-tests/fighting-coach/index.html') },
  },
  preview: { host: '127.0.0.1', port: 0 },
}
await build(config)
const server = await preview(config)
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-3d-apis', '--no-proxy-server'],
})
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  page.setDefaultTimeout(30000)
  page.on('pageerror', (error) => errors.push(error.message))
  const port = server.httpServer.address().port
  await page.goto(`http://127.0.0.1:${port}/ui-tests/fighting-coach/`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.coachFixture))
  await page.getByText('Apprendre le Nen · 20 exercices pratiques', { exact: true }).click()
  await page
    .getByRole('button', { name: '20. Préparation : interrompre une rotation', exact: true })
    .click()
  await page.evaluate(() => window.coachFixture.advance(1))
  await page.evaluate(() => window.coachFixture.move('light'))
  await page.evaluate(() => window.coachFixture.advance(16))
  await page.getByText('Exercice réussi.', { exact: false }).waitFor()
  assert.equal((await page.evaluate(() => window.coachFixture.snapshot())).lesson.complete, true)
  await page.getByRole('button', { name: 'Charger un extrait vérifié', exact: true }).click()
  await page.getByText('Comprendre et pratiquer depuis ce replay', { exact: true }).click()
  await page.getByRole('button', { name: 'Analyser ce replay', exact: true }).click()
  await page
    .getByText('Analyse vérifiée · repères limités aux faits observés.', { exact: false })
    .waitFor()
  await page.getByText('Récupération à étudier', { exact: true }).waitFor()
  const initial = await page.evaluate(() => window.coachFixture.snapshot())
  assert.equal(initial.playback.packet, 0)
  await page.getByRole('button', { name: 'Revoir cette situation', exact: true }).first().click()
  const before = await page.evaluate(() => window.coachFixture.snapshot())
  assert.ok(before.playback.packet > 0)
  await page.getByRole('button', { name: 'Reprendre le contrôle', exact: true }).click()
  const practice = await page.evaluate(() => window.coachFixture.snapshot())
  assert.equal(practice.state.player.aura, before.state.player.aura)
  assert.equal(practice.practice.packet, before.playback.packet)
  assert.equal(practice.lesson, null)
  await page.getByRole('button', { name: 'Répéter cet essai', exact: true }).click()
  await page.getByRole('button', { name: 'Retour à la relecture', exact: true }).click()
  assert.equal(
    (await page.evaluate(() => window.coachFixture.snapshot())).state.hash,
    before.state.hash,
  )
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.screenshot({ path: path.join(output, `coach-${width}.png`), fullPage: true })
  }
  await page.evaluate(() => window.coachFixture.english())
  await page.getByRole('button', { name: 'Analyse this replay', exact: true }).waitFor()
  await page.getByLabel('Diagnostic perspective', { exact: true }).selectOption('opponent')
  await page.evaluate(async () => {
    const button = (name) =>
      [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === name)
    button('Analyse this replay').click()
    await Promise.resolve()
    button('Cancel analysis').click()
  })
  await page.getByText('Analysis cancelled.', { exact: false }).waitFor()
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        productionBundle: true,
        languages: ['fr', 'en'],
        widths: [1280, 390, 320],
        curriculum: 20,
        realInterruption: true,
        verifiedDiagnosis: true,
        originalCursorUnchanged: true,
        rehearsal: true,
        repeat: true,
        cancel: true,
        errors,
      },
      null,
      2,
    ) + '\n',
  )
  console.warn(`Clash learning and replay coach passed; ${output}`)
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
