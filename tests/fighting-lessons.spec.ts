import { expect, test, type Page } from 'playwright/test'
import { openPauseTab } from './helpers/fighting'

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

async function lesson(page: Page, name: string) {
  await page.goto('/fr/fighting/academy', { waitUntil: 'networkidle' })
  const time = new Date('2026-11-17T12:00:00Z')
  await page.clock.install({ time })
  await page.clock.pauseAt(new Date(time.getTime() + 1000))
  await page.getByRole('button', { name, exact: true }).click()
  await expect(page.locator('.battle-objective')).toBeVisible()
  await expect(page.locator('.ready-overlay')).toHaveCount(0)
  await expect(page.locator('.fight-scene canvas')).toHaveAttribute('data-engine', /three\.js/)
}
async function advanceFight(page: Page, milliseconds: number) {
  // Software rendering must not decide how much recovery/aura time has elapsed.
  for (let remaining = milliseconds; remaining > 0; remaining -= 50)
    await page.clock.fastForward(Math.min(50, remaining))
}
async function hatsu(page: Page, direction?: string) {
  if (direction) await page.keyboard.down(direction)
  await page.keyboard.press('l')
  await advanceFight(page, 50)
  if (direction) await page.keyboard.up(direction)
  await advanceFight(page, 1000)
}
const panel = (page: Page) => page.locator('.battle-objective')

test('Ren is action-gated, pauses safely, retries, and returns to free training', async ({
  page,
}) => {
  await lesson(page, '6. Ren : maintenir son aura')
  await expect(panel(page).locator('strong')).toContainText('1/1')
  await openPauseTab(page, 'Entraînement')
  await expect(page.getByRole('button', { name: 'Exercice suivant' })).toBeDisabled()
  await page.locator('.clash-pause-menu').focus()
  await page.keyboard.down('Space')
  await advanceFight(page, 1200)
  await expect(panel(page)).not.toContainText('Exercice réussi.')
  await page.keyboard.up('Space')
  await page.keyboard.press('p')
  await page.keyboard.down('Space')
  await advanceFight(page, 1200)
  await expect(panel(page)).toContainText('Exercice réussi.', { timeout: 15000 })
  await expect(panel(page).locator('strong')).toContainText('1/1')
  await page.keyboard.up('Space')
  await openPauseTab(page, 'Entraînement')
  await page.getByRole('button', { name: 'Recommencer', exact: true }).click()
  await expect(panel(page)).not.toContainText('Exercice réussi.')
  await expect(panel(page).locator('strong')).toContainText('1/1')
  await openPauseTab(page, 'Entraînement')
  await page.getByRole('button', { name: 'Entraînement libre', exact: true }).click()
  await expect(panel(page)).toHaveCount(0)
  await expect(
    page.getByRole('region', { name: 'Laboratoire d’entraînement', exact: true }),
  ).toBeVisible()
})

test('Kurapika pays the Emperor Time cost then turns it off', async ({ page }) => {
  await lesson(page, '12. Kurapika : le prix des yeux écarlates')
  await expect(panel(page).locator('strong')).toContainText('1/2')
  await page.keyboard.down('Space')
  await advanceFight(page, 50)
  await page.keyboard.press('h')
  await advanceFight(page, 1000)
  await page.keyboard.up('Space')
  await expect(panel(page)).toContainText('2/2', { timeout: 15000 })
  await page.keyboard.down('Space')
  await advanceFight(page, 50)
  await page.keyboard.press('h')
  await advanceFight(page, 1000)
  await page.keyboard.up('Space')
  await expect(panel(page)).toContainText('Exercice réussi.')
  await expect(panel(page).locator('strong')).toContainText('2/2')
})

test('Hisoka attaches and recalls the tether', async ({ page }) => {
  await lesson(page, '13. Hisoka : attacher et rappeler')
  await hatsu(page)
  await expect(panel(page)).toContainText('2/2', { timeout: 15000 })
  await advanceFight(page, 650)
  await page.keyboard.down('q')
  await advanceFight(page, 650)
  await page.keyboard.up('q')
  await hatsu(page, 'd')
  await expect(panel(page)).toContainText('Exercice réussi.', { timeout: 15000 })
})

test('Chrollo bookmarks and changes the open page', async ({ page }) => {
  await lesson(page, '14. Chrollo : gérer deux pages')
  await hatsu(page, 's')
  await expect(panel(page)).toContainText('2/2', { timeout: 15000 })
  await advanceFight(page, 650)
  await hatsu(page, 'q')
  await expect(panel(page)).toContainText('Exercice réussi.', { timeout: 15000 })
})

test('Benjamin attaches Secret Window and the lesson panel stays readable on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await lesson(page, '15. Benjamin : observer sans blesser')
  await hatsu(page, 'd')
  await expect(panel(page)).toContainText('Exercice réussi.', { timeout: 15000 })
  const bounds = await panel(page).boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391)
  await openPauseTab(page, 'Entraînement')
  const buttons = page.locator('.lesson-panel').getByRole('button')
  for (const button of await buttons.all()) {
    const box = await button.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(391)
  }
})
