import { expect, test, type Page } from 'playwright/test'

const BODY_FAMILIES = [
  ['illumi-needle-people', 'plant-needle'],
  ['theta-aura-projectile', 'test'],
  ['yomotsu-hegui', 'consummate'],
  ['body-and-soul', 'interrogate'],
  ['damage-sweet-home', 'link'],
  ['stand-by-me', 'lend'],
  ['bohemian-rhapsody', 'merge'],
] as const

async function openNenPanel(page: Page) {
  const canvas = page.locator('#tour-stage-container canvas').first()
  await expect(canvas).toBeAttached({ timeout: 30_000 })
  await expect
    .poll(() => canvas.evaluate((node) => (node as HTMLCanvasElement).width), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0)

  await page.getByRole('button', { name: /Options$/ }).click()
  const options = page.getByRole('dialog', { name: 'Options', exact: true })
  await expect(options).toBeVisible()
  await options.getByRole('button', { name: 'Nen', exact: true }).click()
  return options
}

test.describe('tour Hatsu deep links', () => {
  for (const [abilityId, actionId] of BODY_FAMILIES) {
    test(`opens ${abilityId} on its first representable use`, async ({ page, isMobile }) => {
      test.skip(
        isMobile,
        'The same responsive wheel is exercised once; Morena covers touch actions.',
      )
      test.slow()

      const response = await page.goto(`/tour?hatsu=${abilityId}`)
      expect(response?.status(), abilityId).toBeLessThan(400)

      const options = await openNenPanel(page)
      const wheel = options.locator(`[data-module-wheel="${abilityId}"]`)
      await expect(wheel, `${abilityId} did not reach the tour HUD`).toBeVisible()

      const preferred = wheel.locator(`button[data-action-id="${actionId}"]`)
      await expect(preferred, `${abilityId} did not select ${actionId}`).toHaveClass(/current/)
      await expect(preferred).toHaveAttribute('aria-disabled', /true|false/)

      // A use the medium cannot execute remains in the canonical wheel instead
      // of disappearing from the visit.
      await expect(wheel.locator('button[aria-disabled="true"]').first()).toBeVisible()
    })
  }
})
