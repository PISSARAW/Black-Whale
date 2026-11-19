import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = process.env.CLASH_PRODUCTION_URL ?? 'http://127.0.0.1:43169'
const output = process.env.CLASH_PRODUCTION_OUTPUT ?? '/tmp/black-whale-clash-production'
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
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (let index = 0; index < 40; index++) {
      step = `fighter ${index} at ${width}`
      const fighter = fighters.nth(index)
      const name = await fighter.getAttribute('aria-label')
      await fighter.click()
      assert.equal(await fighter.getAttribute('aria-pressed'), 'true')
      cases.push({ width, name })
    }
  }
  await page.setViewportSize({ width: 1100, height: 1000 })
  step = 'Machi selection'
  await page.getByRole('button', { name: 'Machi, Phantom Troupe', exact: true }).click()
  await page.getByRole('button').filter({ hasText: 'Confirm P1' }).click()
  step = 'stage'
  await page.getByRole('button').filter({ hasText: 'Choose stage' }).click()
  step = 'rules'
  await page.getByRole('button').filter({ hasText: 'Fight rules' }).click()
  step = 'arena'
  await page.getByRole('button').filter({ hasText: 'Enter the arena' }).click()
  await page.waitForSelector('.fight-scene.ready')
  await page.keyboard.press('Enter')
  assert.ok((await page.locator('canvas').count()) > 0)
  assert.deepEqual(errors, [])
  await page.screenshot({ path: path.join(output, 'production-machi.png') })
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(
    `Production Clash passed: ${cases.length} fighter selections and Machi arena.\n`,
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
