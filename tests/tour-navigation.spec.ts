import { expect, test, type Page } from 'playwright/test'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navigation de la visite' })

async function visit(page: Page) {
  await page.goto('/fr/tour?deck=tier-1')
  await expect(page.locator('#tour-stage-container canvas').first()).toBeVisible({
    timeout: 30_000,
  })
  await expect(
    page.locator('#tour-stage-container').getByText('Salle du banquet', { exact: true }).first(),
  ).toBeVisible({ timeout: 30_000 })
}

async function plan(page: Page) {
  await navigation(page).getByRole('button', { name: 'Plans' }).click()
  const dialog = page.getByRole('dialog', { name: 'Plans', exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}

test('the scene stays wide and options are available on demand', async ({ page }, testInfo) => {
  await visit(page)
  await page.screenshot({ path: testInfo.outputPath('tour-scene.png') })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const stage = await page.locator('#tour-stage-container').boundingBox()
  expect(stage!.width).toBeGreaterThan(page.viewportSize()!.width * 0.85)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )

  const options = navigation(page).getByRole('button', { name: /Options$/ })
  await options.click()
  const drawer = page.getByRole('dialog', { name: 'Options', exact: true })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'Confort', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await drawer.getByRole('button', { name: 'Commandes', exact: true }).click()
  await expect(drawer.getByText('Z Q S D ou les flèches', { exact: true })).toBeVisible()
  await drawer.getByRole('button', { name: 'Sources', exact: true }).click()
  await expect(drawer.getByRole('button', { name: /Copier/ })).toBeVisible()
  await drawer.getByRole('button', { name: /^Preuves/ }).click()
  await expect(drawer.getByRole('button', { name: /^Preuves/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(options).toBeFocused()
})

test('plans preview every level without moving the visitor', async ({ page }, testInfo) => {
  await visit(page)
  const dialog = await plan(page)
  await page.screenshot({ path: testInfo.outputPath('tour-plan.png') })
  const levels = dialog.getByRole('combobox', { name: 'Niveau à afficher' })
  expect(await levels.locator('option').count()).toBeGreaterThan(30)
  await levels.selectOption('interior-room-1004')
  await expect(dialog.getByRole('img')).toHaveAttribute('aria-label', /1004/)
  await expect(dialog.locator('svg > circle[fill="#FFFFF0"]')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Ma position' }).click()
  await expect(levels).toHaveValue('tier-1')
  await levels.selectOption('tier-2')
  await dialog.getByRole('button', { name: /Fermer/ }).click()
  await expect(navigation(page).getByRole('combobox')).toHaveValue('tier-1')
  await navigation(page).getByRole('button', { name: 'Plans' }).click()
  await expect(levels).toHaveValue('tier-1')
})

test('the large plan zooms, resets and travels to a filtered room', async ({ page }) => {
  await visit(page)
  const dialog = await plan(page)
  await dialog.getByRole('button', { name: 'Agrandir', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Voir tout le plan' })).toContainText('140%')
  await dialog.getByRole('button', { name: 'Voir tout le plan' }).click()
  await expect(dialog.getByRole('button', { name: 'Voir tout le plan' })).toContainText('100%')
  await expect(dialog.getByRole('button', { name: 'Réduire', exact: true })).toBeDisabled()
  await dialog.getByRole('combobox').selectOption('tier-2')
  const index = dialog.locator('.room-index')
  if (!(await index.evaluate((element) => (element as HTMLDetailsElement).open)))
    await index.locator('summary').click()
  await index.getByRole('searchbox').fill('projection')
  await expect(index.getByRole('button')).toHaveCount(1)
  await index.getByRole('button').click()
  await expect(dialog).toBeHidden()
  await expect(navigation(page).getByRole('combobox')).toHaveValue('tier-2')
  await expect(
    page.locator('#tour-stage-container').getByText('Salle de projection', { exact: true }).first(),
  ).toBeVisible({ timeout: 30_000 })
})

test('finder and scene tools remain accessible', async ({ page }) => {
  await visit(page)
  await navigation(page).getByRole('button', { name: 'Chercher une pièce' }).click()
  const finder = page.getByRole('dialog')
  await expect(finder).toBeVisible()
  await finder.getByRole('textbox').fill('1004')
  await expect(finder.getByRole('button').filter({ hasText: /1004/ }).first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(finder).toBeHidden()
  await page.locator('.scene-tools > summary').click()
  await expect(page.getByRole('button', { name: /Gyo/ })).toBeVisible()
})

test('plans and options work while the scene is immersive', async ({ page }) => {
  await visit(page)
  await navigation(page)
    .getByRole('button', { name: /Plein écran/ })
    .click()
  await expect(page.locator('.tour-workspace')).toHaveClass(/immersive/)
  const dialog = await plan(page)
  await dialog.getByRole('button', { name: /Fermer/ }).click()
  await navigation(page)
    .getByRole('button', { name: /Options$/ })
    .click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.tour-workspace')).toHaveClass(/immersive/)
  await navigation(page)
    .getByRole('button', { name: /Quitter/ })
    .click()
  await expect(page.locator('.tour-workspace')).not.toHaveClass(/immersive/)
})

test('dragging the plan keeps it open and clicking a room travels there', async ({ page }) => {
  await visit(page)
  const dialog = await plan(page)
  await dialog.getByRole('button', { name: 'Agrandir', exact: true }).click()
  const room = dialog.locator('.drawing').getByRole('button', {
    name: 'Rejoindre Salle du banquet',
    exact: true,
  })
  const bounds = (await room.boundingBox())!
  const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 45, start.y + 25, { steps: 8 })
  await page.mouse.up()
  await expect(dialog).toBeVisible()
  await expect(navigation(page).getByRole('combobox')).toHaveValue('tier-1')
  await dialog.getByRole('combobox').selectOption('tier-2')
  await dialog
    .locator('.drawing')
    .getByRole('button', {
      name: 'Rejoindre Salle de projection',
      exact: true,
    })
    .click()
  await expect(dialog).toBeHidden()
  await expect(navigation(page).getByRole('combobox')).toHaveValue('tier-2')
})
