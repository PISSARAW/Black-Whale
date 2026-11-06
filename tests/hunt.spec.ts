import { expect, test, type Page } from 'playwright/test'

/** Leaves the briefing, and waits for the actions the hunt is played with. */
async function enterTheApartment(page: Page, touch: boolean) {
  const begin = page.getByRole('button', { name: 'Enter the apartment' })
  await begin.scrollIntoViewIfNeeded()
  await expect(begin).toBeInViewport()
  if (touch) await begin.tap()
  else await begin.click()
  await expect(page.getByRole('navigation', { name: 'Hunt actions' })).toBeVisible()
}

test.describe('Hunt V3 critical path', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/hunt')
    expect(response?.status()).toBeLessThan(400)
    // Waiting for the contract list rather than a fixed second: hydration takes
    // as long as the machine gives it, and a blind delay turns a slow worker
    // into a failing test.
    await expect(page.getByRole('button', { name: /Royal apartments/i })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('starts the selected contract with its configured loadout', async ({ page, isMobile }) => {
    const contract = page.getByRole('button', { name: /Royal apartments/i })
    await expect(contract).toHaveAttribute('aria-pressed', 'true')
    if (isMobile) await contract.tap()
    else await contract.click()
    await expect(page.getByRole('button', { name: /Bungee Gum/i })).toBeVisible()
    await page.getByText('Hunt settings', { exact: true }).click()
    const vow = page.getByRole('button', { name: 'No retreat', exact: true })
    if (isMobile) await vow.tap()
    else await vow.click()
    await expect(vow).toHaveAttribute('aria-pressed', 'true')
    await enterTheApartment(page, isMobile)
  })

  test('exposes sound and gameplay controls to assistive technology', async ({
    page,
    isMobile,
  }) => {
    const sound = page.getByRole('button', { name: 'Enable sound' })
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await enterTheApartment(page, isMobile)
    await sound.click()
    const mute = page.getByRole('button', { name: 'Mute sound' })
    await expect(mute).toHaveAttribute('aria-pressed', 'true')
    await mute.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[aria-live="polite"]').first()).toBeAttached()
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
