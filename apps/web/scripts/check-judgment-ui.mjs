import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.JUDGMENT_CHECK_OUTPUT ?? '/tmp/black-whale-judgment-interview-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-preparation/index.html'] },
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'error',
})
await server.listen()
let browser
let page
const errors = []
const cases = []
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--enable-unsafe-swiftshader'],
  })
  page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, hasTouch: true })
  page.setDefaultTimeout(60000)
  page.setDefaultNavigationTimeout(60000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-preparation/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.preparationFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => window.preparationFixture.prepareJudgmentInterview())
    const initial = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(initial.judgment.rule, 'truthful-answers')
    await page
      .getByRole('button', { name: 'Judgment · Demander : Qui es-tu réellement ?', exact: true })
      .click()
    await page.getByRole('button', { name: 'Judgment · Répondre sincèrement', exact: true }).click()
    const answered = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(answered.health, initial.health)
    assert.equal(answered.judgment.inquiry, undefined)
    assert.match(answered.playerHeard.text, /Hisoka/)
    await page
      .getByLabel('Judgment · Question à prononcer', { exact: true })
      .fill('Où se trouvent les autres membres ?')
    await page.getByRole('button', { name: 'Judgment · Poser cette question', exact: true }).click()
    await page
      .getByLabel('Réponse à prononcer', { exact: true })
      .fill('Je ne connais pas leur position actuelle.')
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({
      path: path.join(output, `judgment-${width}.png`),
      fullPage: true,
      timeout: 60000,
    })
    await page
      .getByRole('button', { name: 'Judgment · Prononcer ma réponse sincère', exact: true })
      .click()
    const written = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(written.playerHeard.text, 'Je ne connais pas leur position actuelle.')
    assert.equal(written.health, initial.health)
    await page.getByRole('button', { name: 'Judgment · Poser cette question', exact: true }).click()
    await page.getByRole('button', { name: 'Judgment · Refuser de répondre', exact: true }).click()
    assert.equal((await page.evaluate(() => window.preparationFixture.snapshot())).health, 0)
    cases.push({ width })
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Judgment interview UI passed: ${cases.length} cases.\n`)
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ cases, errors, message: String(error) }, null, 2),
  )
  if (page)
    await page
      .screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
      .catch(() => {})
  throw error
} finally {
  await browser?.close()
  await server.close()
}
