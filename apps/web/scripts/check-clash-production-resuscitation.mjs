import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = process.env.CLASH_PRODUCTION_URL ?? 'http://127.0.0.1:43169'
const output =
  process.env.CLASH_PRODUCTION_OUTPUT ?? '/tmp/black-whale-clash-production-resuscitation'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
page.setDefaultTimeout(60000)
const errors = []
const cases = []
let step = 'landing'
page.on('pageerror', (error) => errors.push(error.stack))
try {
  await page.goto(new URL('/fighting', base).href, { waitUntil: 'networkidle' })
  await page.getByRole('button').filter({ hasText: '2 PLAYERS' }).click()
  step = 'character grid'
  const fighters = page.locator('.character-grid > button')
  await fighters.first().waitFor()
  assert.equal(await fighters.count(), 40)
  step = 'Hisoka selection'
  await fighters.filter({ hasText: 'Hisoka' }).click()
  await page.getByRole('button').filter({ hasText: 'Confirm P1' }).click()
  await fighters.filter({ hasText: 'Theta' }).click()
  step = 'stage'
  await page.getByRole('button').filter({ hasText: 'Choose stage' }).click()
  step = 'rules'
  await page.getByRole('button').filter({ hasText: 'Fight rules' }).click()
  step = 'explicit historical preparation'
  await page.locator('details.clash-advanced > summary').click()
  await page.getByRole('button', { name: 'Scenario combat', exact: true }).click()
  const historical = page.getByRole('checkbox', { name: /Hisoka · chapter 357 scene/ })
  assert.equal(await historical.isChecked(), false)
  const resources = page
    .getByRole('group', { name: 'Resources present before the round', exact: true })
    .getByRole('checkbox')
  for (const resource of await resources.all()) await resource.uncheck()
  await historical.check()
  assert.equal(await historical.isChecked(), true)
  cases.push({ scenarioInitiallySelected: false, explicitlySelected: true })
  step = 'arena'
  await page.getByRole('button').filter({ hasText: 'Enter the arena' }).click()
  await page.waitForSelector('.fight-scene.ready')
  await page.getByRole('button', { name: 'FIGHT', exact: true }).click()
  assert.ok((await page.locator('canvas').count()) > 0)
  step = 'fatal asphyxia in the actual HUD'
  const healthSelector = '.hud .fighter-meter:first-child .health-bar'
  await page.waitForFunction(
    (selector) => document.querySelector(selector)?.getAttribute('aria-valuenow') === '0',
    healthSelector,
  )
  await page.screenshot({ path: path.join(output, 'production-hisoka-pumping.png') })
  step = 'resumed injured Hisoka'
  await page.waitForFunction(
    (selector) => Number(document.querySelector(selector)?.getAttribute('aria-valuenow')) > 0,
    healthSelector,
  )
  const health = await page.locator(healthSelector).evaluate((element) => ({
    current: Number(element.getAttribute('aria-valuenow')),
    maximum: Number(element.getAttribute('aria-valuemax')),
  }))
  assert.ok(health.current > 0 && health.current <= health.maximum / 2)
  cases.push({ asphyxiaHealth: 0, resumedHealth: health.current, maximumHealth: health.maximum })

  assert.deepEqual(errors, [])
  await page.screenshot({ path: path.join(output, 'production-hisoka-resumed.png') })
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(
    'Production Clash passed: explicit chapter 357 preparation, pumping and resumed Hisoka.\n',
  )
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify(
      {
        step,
        cases,
        errors,
        message: String(error),
        text: (await page.locator('body').innerText()).slice(-3000),
        buttons: (await page.getByRole('button').allTextContents()).slice(-12),
      },
      null,
      2,
    ),
  )
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  throw error
} finally {
  await browser.close()
}
