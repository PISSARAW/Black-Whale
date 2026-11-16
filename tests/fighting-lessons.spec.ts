import { expect, test, type Page } from 'playwright/test'

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000)
  // These checks exercise combat commands; animated document scrolling can
  // move the lesson controls under the sticky header during hit-testing.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date('2026-11-16T12:00:00Z') })
})

async function lesson(page: Page, name: RegExp) {
  await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
  await page.getByText(/^Apprendre le Nen · \d+ exercices pratiques$/).click()
  await page.getByRole('button', { name }).click()
  await expect(page.getByRole('region', { name: 'Exercice du Nen', exact: true })).toBeVisible()
  await expect(page.locator('.ready-overlay')).toHaveCount(0)
  await expect(page.locator('.fight-scene canvas')).toHaveAttribute('data-engine', /three\.js/)
  await page.clock.pauseAt(new Date('2026-11-17T12:00:00Z'))
}

async function advanceFight(page: Page, milliseconds: number) {
  // Drive real fixed-step combat at a controlled 20 render batches/s. Wall
  // time on a software rasterizer is not the fighter's recovery time.
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
const panel = (page: Page) => page.getByRole('region', { name: 'Exercice du Nen', exact: true })

test('Ren is action-gated, pauses safely, retries, and returns to free training', async ({
  page,
}) => {
  await lesson(page, /Ren : maintenir son aura$/)
  await expect(panel(page).getByRole('button', { name: 'Exercice suivant' })).toBeDisabled()
  await page.keyboard.press('p')
  await page.keyboard.down('Space')
  await advanceFight(page, 1200)
  await expect(panel(page)).not.toContainText('Exercice réussi.')
  await page.keyboard.up('Space')
  await page.keyboard.press('p')
  await page.keyboard.down('Space')
  await advanceFight(page, 1200)
  await expect(panel(page)).toContainText('Exercice réussi.', { timeout: 15000 })
  await page.keyboard.up('Space')
  const restart = panel(page).getByRole('button', { name: 'Recommencer' })
  await restart.evaluate((node) => node.scrollIntoView({ block: 'center' }))
  await restart.click()
  await expect(panel(page)).not.toContainText('Exercice réussi.')
  await panel(page).getByRole('button', { name: 'Entraînement libre' }).click()
  await expect(panel(page)).toHaveCount(0)
  await expect(
    page.getByRole('region', { name: 'Laboratoire d’entraînement', exact: true }),
  ).toBeVisible()
})

test('Kurapika pays the Emperor Time cost then turns it off', async ({ page }) => {
  await lesson(page, /Kurapika : le prix des yeux écarlates$/)
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
})

test('Hisoka attaches and recalls the tether', async ({ page }) => {
  await lesson(page, /Hisoka : attacher et rappeler$/)
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
  await lesson(page, /Chrollo : gérer deux pages$/)
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
  await lesson(page, /Benjamin : observer sans blesser$/)
  await hatsu(page, 'd')
  await expect(panel(page)).toContainText('Exercice réussi.', { timeout: 15000 })
  const bounds = await panel(page).boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391)
  const buttons = panel(page).getByRole('button')
  for (const button of await buttons.all()) {
    const box = await button.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(391)
  }
})
