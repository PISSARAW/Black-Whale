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
  const lowerTier = page
    .getByRole('navigation', { name: 'Ponts du Black Whale', exact: true })
    .getByRole('button', { name: 'Niveau 5', exact: true })
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

test('positions are visible by default and can be hidden with a shareable URL', async ({
  page,
}) => {
  const positions = page.getByRole('button', { name: 'Présences', exact: true })
  await expect(positions).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.presence-layer')).toBeVisible()
  await positions.click()
  await expect(page.locator('.presence-layer')).toHaveCount(0)
  await expect(page).toHaveURL(/positions=0/)
  await page.reload()
  await expect(positions).toHaveAttribute('aria-pressed', 'false')
})

test('spatial state and filters survive a reload and browser history', async ({ page }) => {
  const tiers = page.getByRole('navigation', { name: 'Ponts du Black Whale', exact: true })
  await tiers.getByRole('button', { name: 'Niveau 3', exact: true }).click()
  await expect(page).toHaveURL(/tier=tier-3/)
  await page.getByRole('button', { name: 'Open Cineplex', exact: true }).click()
  await expect(page).toHaveURL(/location=t3-cinema/)
  await page.reload()
  await expect(page.getByRole('complementary', { name: 'Détails du lieu' })).toBeVisible()
  await page.goBack()
  await expect(page).not.toHaveURL(/location=/)
  await expect(tiers.getByRole('button', { name: 'Niveau 3', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('the NEN dock never receives a timeline step click with an active Hatsu', async ({ page }) => {
  const next = page.getByRole('button', { name: 'Événement suivant', exact: true })
  if (await next.isDisabled()) {
    await page.getByRole('button', { name: /^Chronologie/i }).click()
    await page.getByLabel('Choisir un événement', { exact: true }).selectOption('0')
  }

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('black-whale:activate-hatsu', { detail: 'bungee-gum' }))
  })
  await expect(page.getByRole('button', { name: 'Changer de Hatsu', exact: true })).toBeVisible()

  const hit = await next.evaluate((button) => {
    const box = button.getBoundingClientRect()
    return document
      .elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      ?.getAttribute('aria-label')
  })
  expect(hit).toBe('Événement suivant')
  await next.click()
  await expect(page).toHaveURL(/eventId=/)
})

test('a grouped room opens an accessible presence list and character card', async ({
  page,
  isMobile,
}) => {
  const tiers = page.getByRole('navigation', { name: 'Ponts du Black Whale', exact: true })
  let grouped = page
    .locator('.group-badge')
    .filter({ hasText: /^×\d+$/ })
    .first()
  let found = false

  for (let tier = 1; tier <= 5; tier += 1) {
    await tiers.getByRole('button', { name: `Niveau ${tier}`, exact: true }).click()
    grouped = page
      .locator('.group-badge')
      .filter({ hasText: /^×\d+$/ })
      .first()
    try {
      await expect(grouped).toBeVisible({ timeout: 1_500 })
      found = true
      break
    } catch {
      // Some tiers have only single occupants at the selected event.
    }
  }

  expect(found).toBe(true)
  await expect(grouped).toBeVisible()
  if (isMobile) await grouped.dispatchEvent('pointerup', { pointerType: 'touch' })
  else {
    await grouped.focus()
    await grouped.press('Enter')
  }

  const list = page.getByRole('region', { name: 'Personnes présentes à cet endroit' })
  await expect(list).toBeVisible()
  const person = list.locator('button.person').first()
  await expect(person).toBeVisible()
  if (isMobile) await person.dispatchEvent('pointerup', { pointerType: 'touch' })
  else {
    await person.focus()
    await person.press('Enter')
  }

  const card = page.getByRole('complementary', {
    name: 'Détails de la position du personnage',
  })
  await expect(card).toBeVisible()
  await expect(card.getByText('Certitude', { exact: true })).toBeVisible()
  await expect(card.getByText('État temporel', { exact: true })).toBeVisible()
  await expect(card.getByText('Provenance', { exact: true })).toBeVisible()
})

test('keyboard, playback and adjacent changes drive the timeline', async ({ page }) => {
  await page.getByRole('button', { name: /^Chronologie/i }).click()
  const eventSelect = page.getByLabel('Choisir un événement', { exact: true })
  await eventSelect.selectOption('0')
  await expect(
    page.getByRole('button', { name: 'Événement précédent', exact: true }),
  ).toBeDisabled()

  const firstEvent = new URL(page.url()).searchParams.get('eventId')
  await page.getByRole('heading', { name: 'Black Whale 01' }).click()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => new URL(page.url()).searchParams.get('eventId')).not.toBe(firstEvent)
  await eventSelect.selectOption('0')
  await expect.poll(() => new URL(page.url()).searchParams.get('eventId')).toBe(firstEvent)

  const changes = page.getByRole('button', {
    name: 'Afficher les changements vers l’événement suivant',
    exact: true,
  })
  const changeEventCount = await eventSelect.locator('option').count()
  let eventWithChanges = -1
  for (let index = 0; index < changeEventCount - 1; index += 1) {
    await eventSelect.selectOption(String(index))
    await expect.poll(async () => Number(await eventSelect.inputValue())).toBe(index)
    if (await changes.isEnabled()) {
      eventWithChanges = index
      break
    }
  }
  if (eventWithChanges >= 0) {
    await changes.click()
    await expect(page.locator('.delta-overlay')).toBeVisible()
    await changes.click()
  } else {
    // Canon data can legitimately contain no visible movement between adjacent
    // events after spoiler filtering. In that state the control must stay inert.
    await expect(changes).toBeDisabled()
    await expect(page.locator('.delta-overlay')).toHaveCount(0)
  }

  await eventSelect.selectOption('0')
  await expect.poll(() => new URL(page.url()).searchParams.get('eventId')).toBe(firstEvent)
  const play = page.getByRole('button', { name: 'Lire la chronologie', exact: true })
  const beforePlayback = new URL(page.url()).searchParams.get('eventId')
  await play.click()
  const pause = page.getByRole('button', {
    name: 'Mettre la chronologie en pause',
    exact: true,
  })
  await expect(pause).toBeVisible()
  await expect
    .poll(() => new URL(page.url()).searchParams.get('eventId'), { timeout: 5_000 })
    .not.toBe(beforePlayback)
  await pause.click()
  const pausedAt = new URL(page.url()).searchParams.get('eventId')
  await page.waitForTimeout(3_000)
  expect(new URL(page.url()).searchParams.get('eventId')).toBe(pausedAt)

  await eventSelect.selectOption('0')
  await expect.poll(() => new URL(page.url()).searchParams.get('eventId')).toBe(firstEvent)
  await play.click()
  await expect(pause).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByRole('button', { name: 'Lire la chronologie', exact: true })).toBeVisible()
  const hiddenAt = new URL(page.url()).searchParams.get('eventId')
  await page.waitForTimeout(3_000)
  expect(new URL(page.url()).searchParams.get('eventId')).toBe(hiddenAt)

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const eventCount = await eventSelect.locator('option').count()
  const beforeFinalStep = page.url()
  await eventSelect.selectOption(String(eventCount - 2))
  await expect.poll(() => page.url()).not.toBe(beforeFinalStep)
  await play.click()
  await expect
    .poll(async () => Number(await eventSelect.inputValue()), { timeout: 5_000 })
    .toBe(eventCount - 1)
  const stoppedAtEnd = page.getByRole('button', { name: 'Lire la chronologie', exact: true })
  await expect(stoppedAtEnd).toBeVisible()
  await expect(stoppedAtEnd).toBeDisabled()
})

test('the ship still hands off to the 3D tour', async ({ page }) => {
  await page.getByRole('link', { name: 'Visite virtuelle', exact: true }).click()
  await expect(page).toHaveURL(/\/fr\/tour$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('mobile keeps at least half the viewport for the map', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile layout assertion')
  const height = await page
    .locator('.ship-map-body')
    .evaluate((node) => node.getBoundingClientRect().height)
  expect(height).toBeGreaterThanOrEqual(page.viewportSize()!.height * 0.5)
})
