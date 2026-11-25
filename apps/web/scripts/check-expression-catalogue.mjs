import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { build } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.EXPRESSION_CATALOGUE_OUTPUT ?? '/tmp/black-whale-expression-catalogue'
await mkdir(output, { recursive: true })
await build({
  configFile: false,
  root,
  publicDir: false,
  mode: 'production',
  plugins: [svelte({ configFile: false, compilerOptions: { dev: false } })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  logLevel: 'warn',
  build: {
    outDir: path.join(output, 'production'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(root, 'ui-tests/expression-catalogue/index.html'),
      output: { inlineDynamicImports: true },
    },
  },
})
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--allow-file-access-from-files', '--use-angle=metal', '--enable-gpu'],
})
const errors = []
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1050 },
    deviceScaleFactor: 1.5,
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    pathToFileURL(path.join(output, 'production/ui-tests/expression-catalogue/index.html')).href,
  )
  await page.waitForSelector('canvas[data-expression-ready="true"]', { timeout: 60000 })
  assert.equal(
    (await page
      .getByRole('button', { name: /Neutralité et calme|Attention et réflexion|Gestes ·/ })
      .count()) > 0,
    true,
  )
  for (const [label, name] of [
    ['Furieux', 'anger'],
    ['Pleurs silencieux', 'tears'],
    ['Clin d’œil', 'wink'],
    ['Rougeur', 'blush'],
    ['Dents découvertes', 'teeth'],
  ]) {
    await page
      .locator('.expression-list button')
      .filter({ has: page.getByText(label, { exact: true }) })
      .click()
    await page.waitForTimeout(350)
    assert.equal(await page.locator('.caption strong').textContent(), label)
    await page.locator('.preview-panel').screenshot({ path: path.join(output, `${name}.png`) })
  }
  await page.getByLabel('Modèle', { exact: true }).selectOption('tour')
  await page.getByLabel('Personnage', { exact: true }).selectOption('hisoka')
  await page
    .locator('.expression-list button')
    .filter({ has: page.getByText('Sourire sadique', { exact: true }) })
    .click()
  await page.waitForTimeout(350)
  await page.locator('.preview-panel').screenshot({ path: path.join(output, 'tour-hisoka.png') })
  await page.getByText('Combiner deux expressions', { exact: true }).click()
  await page
    .getByLabel('Seconde expression', { exact: true })
    .selectOption('colere/colere-contenue')
  await page.waitForTimeout(250)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(250)
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    'Mobile layout overflows',
  )
  await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true })
  assert.deepEqual(errors, [])
  assert.equal(await page.getByRole('alert').count(), 0)
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ pass: true, expressions: 238, games: ['tour', 'clash'], errors }, null, 2),
  )
  console.log('Expression catalogue: desktop, mobile, mixed expressions, Tour and Clash verified')
} finally {
  await browser.close()
}
