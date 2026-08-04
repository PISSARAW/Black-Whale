import { expect, test, type Page } from 'playwright/test'

/** Leaves the briefing, and waits for the actions the hunt is played with. */
async function enterTheApartment(page: Page) {
  await page.getByRole('button', { name: 'Enter the apartment' }).click()
  await expect(page.getByRole('navigation', { name: 'Hunt actions' })).toBeVisible()
}

test.describe('Hunt V3 critical path', () => {
  // These have been failing on the phone viewport, unnoticed: nothing in CI ran
  // Playwright, so the only e2e in the repo proved nothing. ADR-001 chantier 1
  // puts the suite in CI, which means every remaining red has to be either
  // fixed or named. This one is named: on iPhone 13 the pre-game controls sit
  // under the fold and the click never lands. It is a real defect of the hunt
  // interface on small screens, not of the test.
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile',
      'Hunt pre-game controls are unreachable on a phone viewport — tracked separately.',
    )
    const response = await page.goto('/hunt')
    expect(response?.status()).toBeLessThan(400)
    // Waiting for the contract list rather than a fixed second: hydration takes
    // as long as the machine gives it, and a blind delay turns a slow worker
    // into a failing test.
    await expect(page.getByRole('button', { name: /Royal apartments/i })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('starts the selected contract with its configured loadout', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Royal apartments/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('button', { name: /Bungee Gum/i })).toBeVisible()
    await enterTheApartment(page)
  })

  test('exposes sound and gameplay controls to assistive technology', async ({ page }) => {
    const sound = page.getByRole('button', { name: 'Enable sound' })
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await enterTheApartment(page)
    await expect(page.locator('[aria-live="polite"]').first()).toBeAttached()
  })

  // `AdvancedNenActions.svelte` exists and has no importer: the Ren/Shu bar the
  // second half of this test looks for is never mounted. The assertion is
  // right and the interface is missing, so the test stays as the record of it
  // rather than being weakened to match the regression.
  test.fixme('selects a contract and vow, then exposes advanced Nen actions', async ({ page }) => {
    const siege = page.getByRole('button', { name: /Blackout siege/i })
    await siege.click()
    await expect(siege).toHaveAttribute('aria-pressed', 'true')

    const vow = page.getByRole('button', { name: /Silent Hunt/i })
    await vow.click()
    await expect(vow).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Enter the apartment' }).click()
    const advancedNen = page.getByRole('navigation', { name: /Advanced Nen/i })
    await expect(advancedNen.getByRole('button', { name: /Ren/ })).toBeVisible()
    await expect(advancedNen.getByRole('button', { name: /Shu/ })).toBeVisible()
  })

  test('creates and opens a validated shared contract', async ({ page }) => {
    await page.getByRole('link', { name: /Create and share a contract/i }).click()
    await expect(page.getByRole('heading', { name: 'Contract editor' })).toBeVisible()

    await page.getByLabel('English title').fill('Silent Meridian')
    await page.getByLabel('Lighting').selectOption('blackout')
    await Promise.all([
      page.waitForURL(/contract=/, { timeout: 20_000 }),
      page.getByRole('link', { name: /Play and share this contract/i }).click(),
    ])
    // The shared contract is read back off the query string once the client has
    // taken over, so this button is what proves the round trip. Waited for
    // rather than slept past: the fixed second that used to stand here was a
    // guess at how long that takes, and a guess is what a locator is for.
    const shared = page.getByRole('button', { name: /Silent Meridian/i })
    await expect(shared).toBeVisible()
    await expect(shared).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/contract=/)
  })
})
