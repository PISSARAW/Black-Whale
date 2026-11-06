import { expect, test, type Page } from 'playwright/test'

const runtimeErrors = new WeakMap<Page, string[]>()
test.beforeEach(({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
})
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page), 'no browser runtime errors').toEqual([])
})

async function open(page: Page) {
  await page.goto('/fr/reconstruction?event=b3742695-aab4-46ce-a5a5-cba370b2e56a')
  await expect(page.locator('.event-strip strong')).not.toBeEmpty()
  await expect(page.locator('.overview .deck-group').first()).toBeVisible({ timeout: 30_000 })
}
const actions = (page: Page) => page.locator('.workspace-actions')
async function drawer(page: Page, name: string) {
  await actions(page).getByRole('button', { name, exact: true }).click()
  const panel = page.getByRole('dialog', { name, exact: true })
  await expect(panel).toBeVisible()
  return panel
}

test('keeps the map wide and secondary information behind panels', async ({ page }, testInfo) => {
  await open(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const stage = (await page.locator('.reconstruction-stage').boundingBox())!
  expect(stage.width).toBeGreaterThan(page.viewportSize()!.width * 0.85)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
  await expect(page.locator('.overview')).not.toHaveClass(/names/)
  await expect(page.locator('.overview .marker')).toHaveCount(0)
  expect(await page.locator('.deck-group').count()).toBeLessThanOrEqual(5)
  for (const button of await page.locator('.deck-group, .event-count').all()) {
    expect(
      await button.evaluate((element) => {
        const box = element.getBoundingClientRect()
        return element.contains(
          document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
        )
      }),
      'map and timeline controls must remain reachable',
    ).toBe(true)
  }
  expect(
    await page
      .locator('.reconstruction-transport')
      .evaluate((element) => getComputedStyle(element).position),
  ).not.toBe('fixed')
  const transport = (await page.locator('.reconstruction-transport').boundingBox())!
  expect(transport.y + transport.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  await page.screenshot({ path: testInfo.outputPath('reconstruction-overview.png') })
})

test('moves through time without reloading page data and finds an event', async ({ page }) => {
  await open(page)
  let loads = 0
  page.on('request', (request) => {
    if (request.url().includes('__data.json')) loads++
  })
  const before = new URL(page.url()).searchParams.get('event')
  await page.getByRole('button', { name: 'Événement suivant', exact: true }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('event')).not.toBe(before)
  expect(loads).toBe(0)
  const panel = await drawer(page, 'Chronologie')
  await panel.getByRole('searchbox').fill('zzzz-no-event')
  await expect(panel.getByText('Aucun événement correspondant.')).toBeVisible()
  await panel.getByRole('searchbox').fill('')
  await panel
    .getByRole('navigation', { name: 'Chronologie du voyage' })
    .getByRole('button')
    .first()
    .click()
  await expect(panel).toBeHidden()
})

test('shows event details, all changes and evidence when requested', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Voir les détails', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Événement', exact: true })
  await expect(panel).toBeVisible()
  await expect(panel.locator('h3').first()).not.toBeEmpty()
  await panel
    .locator('.inspector-tabs')
    .getByRole('button', { name: 'Changements', exact: true })
    .click()
  await expect(panel.getByRole('heading', { name: 'Depuis l’événement précédent' })).toBeVisible()
  await panel
    .locator('.inspector-tabs')
    .getByRole('button', { name: 'Sources', exact: true })
    .click()
  await expect(panel.getByRole('heading', { name: 'Sources et méthode' })).toBeVisible()
  await expect(panel.locator('.evidence li').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page.getByRole('button', { name: 'Voir les détails', exact: true })).toBeFocused()
})

test('selects a map character and follows their journey', async ({ page }, testInfo) => {
  await open(page)
  await page.locator('.deck-group').first().click()
  const panel = page.getByRole('dialog', { name: 'Personnages', exact: true })
  await expect(panel).toBeVisible()
  const person = panel.locator('[data-person]').first()
  const id = await person.getAttribute('data-person')
  await person.click()
  await expect(panel.getByRole('region', { name: 'Personnage sélectionné' })).toBeVisible()
  await panel.getByRole('button', { name: 'Suivre ce personnage', exact: true }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('follow')).toBe(id)
  await page.screenshot({ path: testInfo.outputPath('reconstruction-character.png') })
  await panel.getByRole('button', { name: /Fermer/ }).click()
  await expect(page.locator('.follow-bar')).toBeVisible()
  await page.getByRole('button', { name: 'Arrêter le suivi', exact: true }).click()
  await expect(page.locator('.follow-bar')).toHaveCount(0)
})

test('zooms and drags without opening a character accidentally', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Agrandir la carte', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Voir tout le navire' })).toContainText('140%')
  const marker = page.locator('.overview .deck-group').first()
  const bounds = (await marker.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width / 2 + 45, bounds.y + bounds.height / 2 + 20, {
    steps: 8,
  })
  await page.mouse.up()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Voir tout le navire' }).click()
  await expect(page.getByRole('button', { name: 'Voir tout le navire' })).toContainText('100%')
})

test('exposes map filters and keeps them in the shareable URL', async ({ page }) => {
  await open(page)
  const panel = await drawer(page, 'Filtres')
  await panel.getByRole('checkbox', { name: 'Afficher les noms sur la carte' }).check()
  await panel
    .getByRole('combobox', { name: 'Filtres de la carte', exact: true })
    .selectOption('changed')
  await panel.getByRole('combobox', { name: 'Filtrer par certitude' }).selectOption('CONFIRMED')
  await panel.getByRole('button', { name: /Fermer/ }).click()
  await expect(page.locator('.overview')).toHaveClass(/names/)
  await expect.poll(() => new URL(page.url()).searchParams.get('changes')).toBe('1')
  await expect.poll(() => new URL(page.url()).searchParams.get('certainty')).toBe('CONFIRMED')
  await page.reload()
  await expect(page.locator('.event-strip strong')).toContainText('La classe catalogue')
  const reopened = await drawer(page, 'Filtres')
  await expect(
    reopened.getByRole('combobox', { name: 'Filtres de la carte', exact: true }),
  ).toHaveValue('changed')
  await expect(reopened.getByRole('combobox', { name: 'Filtrer par certitude' })).toHaveValue(
    'CONFIRMED',
  )
})

test('keeps navigation available in the scene and in fullscreen', async ({ page }) => {
  await open(page)
  await page
    .getByRole('navigation', { name: 'Vue de la reconstruction' })
    .getByRole('button', { name: 'Scène 3D', exact: true })
    .click()
  await expect(page.locator('.tour-stage canvas').first()).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('scene')
  await actions(page).getByRole('button', { name: 'Plein écran', exact: true }).click()
  await expect(page.locator('.reconstruction-workspace')).toHaveClass(/immersive/)
  const panel = await drawer(page, 'Chronologie')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page.locator('.reconstruction-workspace')).toHaveClass(/immersive/)
  await page
    .getByRole('navigation', { name: 'Vue de la reconstruction' })
    .getByRole('button', { name: 'Navire', exact: true })
    .click()
  await expect(page.locator('.overview')).toBeVisible()
  await actions(page)
    .getByRole('button', { name: /Quitter/ })
    .click()
  await expect(page.locator('.reconstruction-workspace')).not.toHaveClass(/immersive/)
})

test('plays and pauses the chronology', async ({ page }) => {
  await open(page)
  const before = new URL(page.url()).searchParams.get('event')
  await page.getByRole('button', { name: 'Lire la chronologie', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Mettre la chronologie en pause' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => new URL(page.url()).searchParams.get('event'), { timeout: 15000 })
    .not.toBe(before)
  await page.getByRole('button', { name: 'Mettre la chronologie en pause' }).click()
  await expect(
    page.getByRole('button', { name: 'Lire la chronologie', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
})

test('opens the Nen chooser from filters with usable focus', async ({ page }) => {
  await open(page)
  const panel = await drawer(page, 'Filtres')
  await panel.getByRole('button', { name: 'Choisir un Hatsu', exact: true }).click()
  await expect(panel).toBeHidden()
  const picker = page.getByRole('region', { name: 'Choix du Hatsu', exact: true })
  await expect(picker).toBeVisible()
  const search = picker.getByRole('textbox', { name: 'Rechercher un Hatsu', exact: true })
  await search.fill('zzzz-no-ability')
  await expect(search).toBeFocused()
  await expect(picker.locator('.ability-list button')).toHaveCount(0)
  await picker.getByRole('button', { name: 'Fermer', exact: true }).click()
  await expect(picker).toBeHidden()
})

test('restores an observer link and returns to the canonical map', async ({ page }) => {
  const observer = 'fa336818-3380-4c71-8cfa-b8bd2a3ce5d6'
  const response = page.waitForResponse((response) =>
    response.url().includes(`/reconstruction/perspective?observer=${observer}`),
  )
  await page.goto(
    `/fr/reconstruction?event=b3742695-aab4-46ce-a5a5-cba370b2e56a&observer=${observer}`,
  )
  expect((await response).ok()).toBe(true)
  const select = page.getByRole('combobox', { name: 'Point de vue', exact: true })
  await expect(select).toHaveValue(observer)
  await expect(select).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.perspective-status[role="alert"]')).toHaveCount(0)
  await select.selectOption('canon')
  await expect.poll(() => new URL(page.url()).searchParams.has('observer')).toBe(false)
  await expect(page.locator('.overview .deck-group').first()).toBeVisible()
})
