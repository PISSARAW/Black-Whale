import { expect, test } from 'playwright/test'

test.describe('Hunt V3 critical path', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/hunt')
    expect(response?.status()).toBeLessThan(400)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1_000)
  })

  test('starts the selected contract with its configured loadout', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Royal apartments/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('button', { name: /Bungee Gum/i })).toBeVisible()
    await page.getByRole('button', { name: 'Enter the apartment' }).click()
    await expect(page.getByRole('navigation', { name: 'Hunt actions' })).toBeVisible()
  })

  test('exposes sound and gameplay controls to assistive technology', async ({ page }) => {
    const sound = page.getByRole('button', { name: 'Enable sound' })
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await page.getByRole('button', { name: 'Enter the apartment' }).click()
    await expect(page.locator('[aria-live="polite"]').first()).toBeAttached()
    await expect(page.getByRole('navigation', { name: 'Hunt actions' })).toBeVisible()
  })

  test('selects a contract and vow, then exposes advanced Nen actions', async ({ page }) => {
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
    await page.waitForTimeout(1_000)

    const shared = page.getByRole('button', { name: /Silent Meridian/i })
    await expect(shared).toBeVisible()
    await expect(shared).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/contract=/)
  })
})
