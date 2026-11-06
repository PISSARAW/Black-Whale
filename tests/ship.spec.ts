import { expect, test } from 'playwright/test'

// Exercise the map through its public controls: the same paths on desktop and phone.
test.beforeEach(async ({ page }) => {
  const response = await page.goto('/fr/ship')
  expect(response?.status()).toBe(200)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Black Whale 01' })).toBeVisible()
})

for (const [index, count] of [3, 1, 3, 2, 2].entries()) {
  test(`tier ${index + 1} exposes every deck`, async ({ page }) => {
    const tiers = page.getByRole('navigation', { name: 'Ponts du Black Whale', exact: true })
    const decks = page.getByRole('navigation', { name: 'Ponts', exact: true })
    await tiers.getByRole('button', { name: `Niveau ${index + 1}`, exact: true }).click()
    await expect(decks.getByRole('button')).toHaveCount(count)
    for (let deck = 0; deck < count; deck += 1) {
      const choice = decks.getByRole('button').nth(deck)
      await choice.click()
      await expect(choice).toHaveAttribute('aria-current', 'page')
      await expect(page.locator('.ship-canvas svg').first()).toBeVisible()
    }
  })
}

test('a room opens its plan and breadcrumbs return to the deck and overview', async ({ page }) => {
  const tiers = page.getByRole('navigation', { name: 'Ponts du Black Whale', exact: true })
  await tiers.getByRole('button', { name: 'Niveau 1', exact: true }).click()
  await page.getByRole('button', { name: 'Open 1014', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Détails du lieu' })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Y aller à pied/ })).toBeVisible()
  await page
    .locator('.ship-breadcrumb')
    .getByRole('button', { name: 'Enceinte royale', exact: true })
    .click()
  await expect(page.getByRole('complementary', { name: 'Détails du lieu' })).toHaveCount(0)
  await page
    .locator('.ship-breadcrumb')
    .getByRole('button', { name: 'Vue d’ensemble', exact: true })
    .click()
  await expect(tiers.getByRole('button', { name: 'Vue d’ensemble', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('filters persist when the panel closes and can all be reset', async ({ page }) => {
  const filters = page
    .locator('.ship-actions')
    .getByRole('button', { name: 'Filtres', exact: true })
  await filters.click()
  await page.getByRole('checkbox', { name: 'Hunters', exact: true }).check()
  await expect(page.locator('.ship-count')).toHaveText('1')
  await page.getByRole('button', { name: 'Fermer le panneau', exact: true }).click()
  await expect(page.locator('#ship-panel')).toHaveCount(0)
  await page
    .locator('.ship-actions')
    .getByRole('button', { name: /Filtres/ })
    .click()
  await expect(page.getByRole('checkbox', { name: 'Hunters', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Réinitialiser les filtres', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Hunters', exact: true })).not.toBeChecked()
  await expect(page.locator('.ship-count')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(filters).toBeFocused()
})

test('tracking and time navigation preserve each other in the URL', async ({ page }) => {
  await page.getByRole('button', { name: 'Suivre', exact: true }).click()
  const tracking = page.getByLabel('Suivre un personnage ou un objet important', { exact: true })
  const objectValue = await tracking.locator('optgroup option').first().getAttribute('value')
  expect(objectValue).toBeTruthy()
  await tracking.selectOption(objectValue!)
  await expect(page).toHaveURL(/target=object%3A/)
  const target = new URL(page.url()).searchParams.get('target')
  await page.getByRole('button', { name: 'Fermer le panneau', exact: true }).click()
  const lowerTier = page.getByRole('button', { name: 'Niveau 5', exact: true })
  await lowerTier.click()
  await expect(lowerTier).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'Événement précédent', exact: true }).click()
  await expect(page).toHaveURL(/eventId=/)
  expect(new URL(page.url()).searchParams.get('target')).toBe(target)
  await page.getByRole('button', { name: /^Chronologie/i }).click()
  await expect(page.getByLabel('Choisir un événement', { exact: true })).toBeVisible()
  await page.getByLabel('Choisir un événement', { exact: true }).selectOption('0')
  await expect(
    page.getByRole('button', { name: 'Événement précédent', exact: true }),
  ).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Événement suivant', exact: true })).toBeEnabled()
})

test('expanded map, zoom reset and mobile panels stay usable', async ({ page }) => {
  const workspace = page.locator('.ship-workspace')
  await page.getByRole('button', { name: 'Agrandir la carte', exact: true }).click()
  await expect(workspace).toHaveClass(/expanded/)
  await expect
    .poll(async () => workspace.evaluate((node) => Math.round(node.getBoundingClientRect().width)))
    .toBe(page.viewportSize()!.width)
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click()
  await expect(page.locator('.zoom-controls span')).not.toHaveText('100%')
  await page.getByRole('button', { name: 'Réinitialiser la vue', exact: true }).click()
  await expect(page.locator('.zoom-controls span')).toHaveText('100%')
  await page.getByRole('button', { name: 'Repères', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Repères', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#ship-panel')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(workspace).not.toHaveClass(/expanded/)
  const dimensions = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }))
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport)
})

test('the plan starts uncluttered and positions can be revealed on demand', async ({ page }) => {
  const positions = page.getByRole('button', { name: 'Présences', exact: true })
  await expect(positions).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.presence-layer')).toHaveCount(0)
  await positions.click()
  await expect(page.locator('.presence-layer')).toBeVisible()
  await positions.click()
  await expect(page.locator('.presence-layer')).toHaveCount(0)
})
