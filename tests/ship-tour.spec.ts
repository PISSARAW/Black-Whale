import { expect, test } from 'playwright/test'

test('walking from the map preserves the selected room, event and hour', async ({ page }) => {
  await page.goto('/fr/ship')
  await page.getByRole('button', { name: /^Chronologie/i }).click()
  await page.getByLabel('Choisir un événement', { exact: true }).selectOption('0')
  await expect(
    page.getByRole('button', { name: 'Événement précédent', exact: true }),
  ).toBeDisabled()
  const eventId = new URL(page.url()).searchParams.get('eventId')
  expect(eventId).toBeTruthy()
  const hour = (await page.locator('#ship-timeline-events > p').textContent())!.trim()
  expect(hour).not.toBe('')

  await page
    .getByRole('navigation', { name: 'Ponts du Black Whale', exact: true })
    .getByRole('button', { name: 'Niveau 1', exact: true })
    .click()
  await page.getByRole('button', { name: 'Open 1014', exact: true }).click()
  const walk = page.getByRole('link', { name: 'Y aller à pied', exact: true })
  const target = new URL((await walk.getAttribute('href'))!, page.url())
  expect(target.searchParams.get('eventId')).toBe(eventId)
  expect(target.searchParams.get('space')).toBe('tier-1-royal-residential-sector-room-1014')

  await walk.click()
  await expect(page).toHaveURL(target.toString())
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(hour, { exact: true })).toBeVisible({ timeout: 30_000 })
})
