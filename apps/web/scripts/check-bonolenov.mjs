import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.BONOLENOV_CHECK_OUTPUT ?? '/tmp/black-whale-bonolenov-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/bonolenov/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const errors = []
let page
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/bonolenov/`)
  page.setDefaultTimeout(15000)
  await page.waitForFunction(() => window.bonolenovFixture)
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    for (const language of ['fr', 'en']) {
      for (const owner of ['player', 'opponent']) {
        for (const phase of ['dance', 'prologue', 'jupiter', 'metamorphosen']) {
          const shown = await page.evaluate(
            ({ phase, language, owner }) =>
              window.bonolenovFixture.showCase(phase, language, owner),
            { phase, language, owner },
          )
          if (phase === 'dance') assert.equal(shown.battle.preparation.piece, 'prologue')
          if (phase === 'prologue') assert.equal(shown.battle.prologue, true)
          if (phase === 'jupiter') assert.equal(shown.projectiles, 1)
          if (phase === 'metamorphosen') assert.equal(shown.battle.form.model, 'hisoka')
          assert.equal(await page.locator('.battle-cantabile').count(), 1)
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
            false,
          )
          if (width !== 320 && language === 'fr' && owner === 'player')
            await page.screenshot({
              path: path.join(output, `${phase}-${width}.png`),
              fullPage: true,
            })
        }
      }
    }
  }
  await page.evaluate(() => window.bonolenovFixture.showCase('fresh'))
  const panel = page.locator('.battle-cantabile')
  assert.equal(
    await panel.getByRole('button', { name: 'Metamorphosen', exact: true }).isDisabled(),
    true,
  )
  await panel.getByRole('button', { name: 'Prologue', exact: true }).click()
  assert.equal(
    (await page.evaluate(() => window.bonolenovFixture.current())).battle.preparation.piece,
    'prologue',
  )
  await panel.getByRole('button', { name: 'Cesser / revenir', exact: true }).click()
  assert.equal(
    (await page.evaluate(() => window.bonolenovFixture.current())).battle.preparation,
    null,
  )
  await page.evaluate(() => window.bonolenovFixture.showCase('metamorphosen', 'en', 'opponent'))
  await panel.getByRole('button', { name: 'Stop / revert', exact: true }).click()
  assert.equal((await page.evaluate(() => window.bonolenovFixture.current())).battle.form, null)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases: 51, errors }, null, 2))
  process.stdout.write(`Bonolenov UI: 51 cases passed; ${output}\n`)
} catch (error) {
  console.error({ errors, url: page?.url(), failure: String(error) })
  throw error
} finally {
  await browser.close()
  await server.close()
}
